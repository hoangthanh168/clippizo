import { analytics } from "@repo/analytics/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import {
  getPayPalOrder,
  activateSubscription,
  getPlan,
  type PlanId,
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
      profileId: string;
      planId: PlanId;
      isRenewal: boolean;
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

    const { profileId, planId, isRenewal } = customData;

    if (!profileId || !planId) {
      log.error("PayPal webhook: missing required data", { orderId });
      return NextResponse.json(
        { message: "Missing required data", ok: false },
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
    const currency = captureData.amount?.currencyCode || "USD";

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
        plan: planId,
        metadata: {
          isRenewal,
          webhookEventId: body.id,
        },
      },
    });

    // Activate subscription
    await activateSubscription({
      profileId,
      planId,
      isRenewal,
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
