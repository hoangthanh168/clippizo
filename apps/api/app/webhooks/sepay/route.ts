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
  getPlan,
  parseSePayCustomData,
  parseSePayPackCustomData,
  verifySePayIPN,
} from "@repo/payments";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const headerPayload = await headers();
    const secretKey = headerPayload.get("X-Secret-Key") || "";

    const verification = verifySePayIPN(secretKey, body);

    if (!(verification.isValid && verification.payload)) {
      log.warn("SePay IPN verification failed", {
        error: verification.error,
      });
      return NextResponse.json(
        { message: verification.error, ok: false },
        { status: 400 }
      );
    }

    const { notification_type, order, transaction } = verification.payload;

    log.info("SePay IPN received", {
      type: notification_type,
      orderId: order.id,
      transactionId: transaction.transaction_id,
    });

    if (notification_type !== "ORDER_PAID") {
      log.info("SePay IPN: non-payment notification", {
        type: notification_type,
      });
      return NextResponse.json({ message: "Acknowledged", ok: true });
    }

    // Try to parse as pack purchase first
    const packCustomData = parseSePayPackCustomData(order.custom_data);

    if (packCustomData) {
      return handlePackPurchase({
        profileId: packCustomData.profileId,
        packId: packCustomData.packId,
        orderId: order.id,
        transactionId: transaction.transaction_id,
        amount: order.order_amount,
        invoiceNumber: order.order_invoice_number,
        paymentMethod: transaction.payment_method,
      });
    }

    // Parse as subscription custom data
    const customData = parseSePayCustomData(order.custom_data);

    if (!customData) {
      log.error("SePay IPN: missing custom data", { orderId: order.id });
      return NextResponse.json(
        { message: "Invalid custom data", ok: false },
        { status: 400 }
      );
    }

    const { profileId, planId, isRenewal } = customData;

    // Check for idempotency - has this transaction already been processed?
    const existingPayment = await database.payment.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: "sepay",
          providerTransactionId: transaction.transaction_id,
        },
      },
    });

    if (existingPayment) {
      log.info("SePay IPN: duplicate transaction", {
        transactionId: transaction.transaction_id,
      });
      return NextResponse.json({ message: "Already processed", ok: true });
    }

    // Get plan details
    const plan = getPlan(planId);
    if (!plan) {
      log.error("SePay IPN: invalid plan", { planId });
      return NextResponse.json(
        { message: "Invalid plan", ok: false },
        { status: 400 }
      );
    }

    // Create payment record
    await database.payment.create({
      data: {
        profileId,
        amount: order.order_amount,
        currency: "VND",
        provider: "sepay",
        providerTransactionId: transaction.transaction_id,
        providerOrderId: order.id,
        status: "completed",
        paymentType: "subscription",
        plan: planId,
        packId: null,
        metadata: {
          paymentMethod: transaction.payment_method,
          invoiceNumber: order.order_invoice_number,
          isRenewal,
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
          provider: "sepay",
          amount: order.order_amount,
          currency: "VND",
          creditsAllocated: creditAllocation.creditsAllocated,
          source: "webhook",
        },
      });
    }

    await analytics.shutdown();

    log.info("SePay payment processed successfully", {
      profileId,
      planId,
      transactionId: transaction.transaction_id,
    });

    return NextResponse.json({ message: "Success", ok: true });
  } catch (error) {
    const message = parseError(error);
    log.error("SePay webhook error", { error: message });

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
  invoiceNumber: string;
  paymentMethod: string;
}): Promise<Response> {
  const {
    profileId,
    packId,
    orderId,
    transactionId,
    amount,
    invoiceNumber,
    paymentMethod,
  } = params;

  // Check for idempotency
  const existingPayment = await database.payment.findUnique({
    where: {
      provider_providerTransactionId: {
        provider: "sepay",
        providerTransactionId: transactionId,
      },
    },
  });

  if (existingPayment) {
    log.info("SePay IPN: duplicate pack transaction", { transactionId });
    return NextResponse.json({ message: "Already processed", ok: true });
  }

  // Create payment record
  await database.payment.create({
    data: {
      profileId,
      amount,
      currency: "VND",
      provider: "sepay",
      providerTransactionId: transactionId,
      providerOrderId: orderId,
      status: "completed",
      paymentType: "credit_pack",
      plan: null,
      packId,
      metadata: {
        invoiceNumber,
        paymentMethod,
      },
    },
  });

  // Finalize credit pack purchase
  const packResult = await finalizeCreditPackPurchase(profileId, packId, {
    provider: "sepay",
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
        provider: "sepay",
        amount,
        currency: "VND",
        creditsAdded: packResult.creditsAdded,
        source: "webhook",
      },
    });
  }

  await analytics.shutdown();

  log.info("SePay pack IPN processed successfully", {
    profileId,
    packId,
    creditsAdded: packResult.creditsAdded,
    transactionId,
  });

  return NextResponse.json({ message: "Success", ok: true });
}
