import { analytics } from "@repo/analytics/server";
import {
  allocateCreditsOnSubscriptionActivation,
  finalizeCreditPackPurchase,
} from "@repo/credits";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import {
  activateSubscription,
  extractPayPalWebhookHeaders,
  getPayPalOrder,
  getPlan,
  keys,
  type PlanId,
  verifyPayPalWebhook,
} from "@repo/payments";
import { NextResponse } from "next/server";

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    purchase_units?: Array<{
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id: string;
          amount: {
            value: string;
            currency_code: string;
          };
        }>;
      };
    }>;
  };
}

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = (await request.json()) as PayPalWebhookEvent;

    log.info("PayPal webhook received", {
      eventId: body.id,
      eventType: body.event_type,
    });

    // Verify webhook signature
    const webhookHeaders = extractPayPalWebhookHeaders(request.headers);
    const env = keys();

    if (
      webhookHeaders.transmissionId &&
      webhookHeaders.transmissionTime &&
      webhookHeaders.certUrl &&
      webhookHeaders.authAlgo &&
      webhookHeaders.transmissionSig &&
      env.PAYPAL_WEBHOOK_ID
    ) {
      const verification = await verifyPayPalWebhook({
        transmissionId: webhookHeaders.transmissionId,
        transmissionTime: webhookHeaders.transmissionTime,
        certUrl: webhookHeaders.certUrl,
        authAlgo: webhookHeaders.authAlgo,
        transmissionSig: webhookHeaders.transmissionSig,
        webhookId: env.PAYPAL_WEBHOOK_ID,
        webhookEvent: body,
      });

      if (!verification.isValid) {
        log.warn("PayPal webhook: invalid signature", {
          error: verification.error,
        });
        return NextResponse.json(
          { message: "Invalid signature", ok: false },
          { status: 401 }
        );
      }
    }

    // Only process completed capture events
    if (body.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      log.info("PayPal webhook: non-capture event", {
        type: body.event_type,
      });
      return NextResponse.json({ message: "Acknowledged", ok: true });
    }

    const capture = body.resource;
    const orderId = capture.id;

    // Get full order details
    const order = await getPayPalOrder(orderId);
    const purchaseUnit = order.purchaseUnits?.[0];
    const captureData = purchaseUnit?.payments?.captures?.[0];

    if (!captureData) {
      log.warn("PayPal webhook: no capture data", { orderId });
      return NextResponse.json({ message: "No capture data", ok: false });
    }

    // Parse custom data
    let customData: {
      type?: "pack" | "subscription";
      profileId: string;
      planId?: PlanId;
      packId?: string;
      isRenewal?: boolean;
    };

    try {
      customData = JSON.parse(purchaseUnit?.customId || "{}");
    } catch {
      log.error("PayPal webhook: invalid custom data", { orderId });
      return NextResponse.json(
        { message: "Invalid custom data", ok: false },
        { status: 400 }
      );
    }

    const { profileId } = customData;

    if (!profileId) {
      log.error("PayPal webhook: missing profileId", { orderId });
      return NextResponse.json(
        { message: "Missing required data", ok: false },
        { status: 400 }
      );
    }

    // Handle pack purchase
    if (customData.type === "pack" && customData.packId) {
      return handlePackPurchase({
        profileId,
        packId: customData.packId,
        orderId,
        transactionId: captureData?.id ?? "",
        amount: Number.parseFloat(captureData?.amount?.value || "0"),
        currencyCode: captureData?.amount?.currencyCode || "USD",
        webhookEventId: body.id,
      });
    }

    // Handle subscription payment
    const { planId, isRenewal } = customData;

    if (!planId) {
      log.error("PayPal webhook: missing planId for subscription", { orderId });
      return NextResponse.json(
        { message: "Missing plan data", ok: false },
        { status: 400 }
      );
    }

    // Check for idempotency
    const transactionId = captureData.id ?? "";
    if (!transactionId) {
      log.error("PayPal webhook: missing transaction ID", { orderId });
      return NextResponse.json(
        { message: "Missing transaction ID", ok: false },
        { status: 400 }
      );
    }

    const existingPayment = await database.payment.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: "paypal",
          providerTransactionId: transactionId,
        },
      },
    });

    if (existingPayment) {
      log.info("PayPal webhook: duplicate transaction", {
        transactionId: captureData.id,
      });
      return NextResponse.json({ message: "Already processed", ok: true });
    }

    // Get plan details
    const plan = getPlan(planId);
    if (!plan) {
      log.error("PayPal webhook: invalid plan", { planId });
      return NextResponse.json(
        { message: "Invalid plan", ok: false },
        { status: 400 }
      );
    }

    const amount = Number.parseFloat(captureData.amount?.value || "0");
    const currencyCode = captureData.amount?.currencyCode || "USD";
    const currency = currencyCode === "VND" ? "VND" : "USD";

    // Create payment record
    const payment = await database.payment.create({
      data: {
        profileId,
        amount,
        currency,
        provider: "paypal",
        providerTransactionId: transactionId,
        providerOrderId: orderId,
        status: "completed",
        paymentType: "subscription",
        plan: planId,
        packId: null,
        metadata: {
          isRenewal,
          webhookEventId: body.id,
        },
      },
    });

    // Activate subscription
    const subscriptionResult = await activateSubscription({
      profileId,
      planId,
      isRenewal,
    });

    // Allocate monthly credits
    const creditAllocation = await allocateCreditsOnSubscriptionActivation(
      profileId,
      planId,
      subscriptionResult.expiresAt
    );

    log.info("Credits allocated", {
      profileId,
      creditsAllocated: creditAllocation.creditsAllocated,
      totalBalance: creditAllocation.totalBalance,
    });

    // Track analytics
    const profile = await database.profile.findUnique({
      where: { id: profileId },
      select: { clerkUserId: true },
    });

    if (profile) {
      analytics.capture({
        event: isRenewal ? "Subscription Renewed" : "Subscription Activated",
        distinctId: profile.clerkUserId,
        properties: {
          plan: planId,
          provider: "paypal",
          amount,
          currency,
          source: "webhook",
          creditsAllocated: creditAllocation.creditsAllocated,
        },
      });
    }

    await analytics.shutdown();

    log.info("PayPal webhook processed successfully", {
      profileId,
      planId,
      transactionId: captureData.id,
    });

    return NextResponse.json({ message: "Success", ok: true });
  } catch (error) {
    const message = parseError(error);
    log.error("PayPal webhook error", { error: message });

    return NextResponse.json(
      { message: "Internal error", ok: false },
      { status: 500 }
    );
  }
};

// Handle credit pack purchase
async function handlePackPurchase(params: {
  profileId: string;
  packId: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currencyCode: string;
  webhookEventId: string;
}): Promise<Response> {
  const {
    profileId,
    packId,
    orderId,
    transactionId,
    amount,
    currencyCode,
    webhookEventId,
  } = params;

  // Convert currency code to enum
  const currency = currencyCode === "VND" ? "VND" : "USD";

  // Check for idempotency
  const existingPayment = await database.payment.findUnique({
    where: {
      provider_providerTransactionId: {
        provider: "paypal",
        providerTransactionId: transactionId,
      },
    },
  });

  if (existingPayment) {
    log.info("PayPal webhook: duplicate pack transaction", { transactionId });
    return NextResponse.json({ message: "Already processed", ok: true });
  }

  // Create payment record
  await database.payment.create({
    data: {
      profileId,
      amount,
      currency,
      provider: "paypal",
      providerTransactionId: transactionId,
      providerOrderId: orderId,
      status: "completed",
      paymentType: "credit_pack",
      plan: null,
      packId,
      metadata: {
        webhookEventId,
      },
    },
  });

  // Finalize credit pack purchase
  const packResult = await finalizeCreditPackPurchase(profileId, packId, {
    provider: "paypal",
    transactionId,
    orderId,
  });

  // Track analytics
  const profile = await database.profile.findUnique({
    where: { id: profileId },
    select: { clerkUserId: true },
  });

  if (profile) {
    analytics.capture({
      event: "Credit Pack Purchased",
      distinctId: profile.clerkUserId,
      properties: {
        packId,
        provider: "paypal",
        amount,
        currency,
        creditsAdded: packResult.creditsAdded,
        source: "webhook",
      },
    });
  }

  await analytics.shutdown();

  log.info("PayPal pack webhook processed successfully", {
    profileId,
    packId,
    creditsAdded: packResult.creditsAdded,
    transactionId,
  });

  return NextResponse.json({ message: "Success", ok: true });
}
