import { analytics } from "@repo/analytics/server";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import {
  activateSubscription,
  capturePayPalOrder,
  getPlan,
} from "@repo/payments";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", ok: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { message: "Missing orderId", ok: false },
        { status: 400 }
      );
    }

    // Capture the payment
    const captureResult = await capturePayPalOrder(orderId);

    const { profileId, planId, isRenewal } = captureResult.customData;

    // Verify the profile matches the authenticated user
    const profile = await database.profile.findUnique({
      where: { id: profileId },
      select: { id: true, clerkUserId: true },
    });

    if (!profile || profile.clerkUserId !== userId) {
      log.error("PayPal capture: profile mismatch", {
        profileId,
        userId,
      });
      return NextResponse.json(
        { message: "Unauthorized", ok: false },
        { status: 401 }
      );
    }

    // Check for idempotency
    const existingPayment = await database.payment.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: "paypal",
          providerTransactionId: captureResult.transactionId,
        },
      },
    });

    if (existingPayment) {
      log.info("PayPal capture: duplicate transaction", {
        transactionId: captureResult.transactionId,
      });
      return NextResponse.json({
        message: "Already processed",
        ok: true,
      });
    }

    // Get plan details
    const plan = getPlan(planId);
    if (!plan) {
      log.error("PayPal capture: invalid plan", { planId });
      return NextResponse.json(
        { message: "Invalid plan", ok: false },
        { status: 400 }
      );
    }

    // Create payment record
    const currency = captureResult.currency === "VND" ? "VND" : "USD";
    await database.payment.create({
      data: {
        profileId,
        amount: captureResult.amount,
        currency,
        provider: "paypal",
        providerTransactionId: captureResult.transactionId,
        providerOrderId: captureResult.orderId,
        status: "completed",
        paymentType: "subscription",
        plan: planId,
        packId: null,
        metadata: {
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
    analytics.capture({
      event: isRenewal ? "Subscription Renewed" : "Subscription Activated",
      distinctId: profile.clerkUserId,
      properties: {
        plan: planId,
        provider: "paypal",
        amount: captureResult.amount,
        currency: captureResult.currency,
      },
    });

    await analytics.shutdown();

    log.info("PayPal payment captured successfully", {
      profileId,
      planId,
      transactionId: captureResult.transactionId,
    });

    return NextResponse.json({
      message: "Payment captured",
      ok: true,
    });
  } catch (error) {
    const message = parseError(error);
    log.error("PayPal capture error", { error: message });

    return NextResponse.json(
      { message: "Failed to capture payment", ok: false },
      { status: 500 }
    );
  }
};
