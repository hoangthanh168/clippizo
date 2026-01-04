import { analytics } from "@repo/analytics/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import {
  verifySePayIPN,
  parseSePayCustomData,
  activateSubscription,
  getPlan,
} from "@repo/payments";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const headerPayload = await headers();
    const secretKey = headerPayload.get("X-Secret-Key") || "";

    const verification = verifySePayIPN(secretKey, body);

    if (!verification.isValid || !verification.payload) {
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
      log.info("SePay IPN: non-payment notification", { type: notification_type });
      return NextResponse.json({ message: "Acknowledged", ok: true });
    }

    // Parse custom data to get profile and plan
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
        plan: planId,
        metadata: {
          paymentMethod: transaction.payment_method,
          invoiceNumber: order.order_invoice_number,
          isRenewal,
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
          provider: "sepay",
          amount: order.order_amount,
          currency: "VND",
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
