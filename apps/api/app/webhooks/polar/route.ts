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
  cancelSubscription,
  getPackIdFromPolarProduct,
  getPlan,
  getPlanIdFromPolarProduct,
  isOneTimePurchase,
  isOrderPaidEvent,
  isSubscriptionActiveEvent,
  isSubscriptionCanceledEvent,
  isSubscriptionCreate,
  isSubscriptionRenewal,
  isSubscriptionRevokedEvent,
  keys,
  type PlanId,
  type PolarOrder,
  type PolarSubscription,
  type PolarWebhookEvent,
  verifyPolarWebhook,
  WebhookVerificationError,
} from "@repo/payments";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const headerEntries = Object.fromEntries(request.headers);

    const env = keys();

    // Verify webhook signature
    let event: PolarWebhookEvent;

    if (env.POLAR_WEBHOOK_SECRET) {
      try {
        event = verifyPolarWebhook(
          rawBody,
          headerEntries,
          env.POLAR_WEBHOOK_SECRET
        );
      } catch (error) {
        if (error instanceof WebhookVerificationError) {
          log.warn("Polar webhook: invalid signature");
          return NextResponse.json(
            { message: "Invalid signature", ok: false },
            { status: 403 }
          );
        }
        throw error;
      }
    } else {
      // Skip verification in dev if webhook secret not configured
      log.warn("Polar webhook: skipping signature verification (dev mode)");
      event = JSON.parse(rawBody) as PolarWebhookEvent;
    }

    log.info("Polar webhook received", {
      eventType: event.type,
      timestamp: event.timestamp,
    });

    // Handle different event types
    if (isOrderPaidEvent(event)) {
      return handleOrderPaid(event.data);
    }

    if (isSubscriptionActiveEvent(event)) {
      return handleSubscriptionActive(event.data);
    }

    if (isSubscriptionCanceledEvent(event)) {
      return handleSubscriptionCanceled(event.data);
    }

    if (isSubscriptionRevokedEvent(event)) {
      return handleSubscriptionRevoked(event.data);
    }

    // Acknowledge other events
    log.info("Polar webhook: unhandled event type", { type: event.type });
    return NextResponse.json({ message: "Acknowledged", ok: true });
  } catch (error) {
    const message = parseError(error);
    log.error("Polar webhook error", { error: message });

    return NextResponse.json(
      { message: "Internal error", ok: false },
      { status: 500 }
    );
  }
};

/**
 * Handle order.paid event
 * This is triggered for both one-time purchases and subscription payments
 */
async function handleOrderPaid(order: PolarOrder): Promise<Response> {
  const orderId = order.id;
  const profileId = order.customer.external_id;

  if (!profileId) {
    log.error("Polar webhook: missing external_id (profileId)", { orderId });
    return NextResponse.json(
      { message: "Missing customer external_id", ok: false },
      { status: 400 }
    );
  }

  // Check for idempotency
  const existingPayment = await database.payment.findUnique({
    where: {
      provider_providerTransactionId: {
        provider: "polar",
        providerTransactionId: orderId,
      },
    },
  });

  if (existingPayment) {
    log.info("Polar webhook: duplicate order", { orderId });
    return NextResponse.json({ message: "Already processed", ok: true });
  }

  // Handle based on billing reason
  if (isOneTimePurchase(order)) {
    // One-time credit pack purchase
    const packId = getPackIdFromPolarProduct(order.product_id);

    if (!packId) {
      log.error("Polar webhook: unknown pack product", {
        productId: order.product_id,
      });
      return NextResponse.json(
        { message: "Unknown pack product", ok: false },
        { status: 400 }
      );
    }

    return handlePackPurchase({
      profileId,
      packId,
      orderId,
      amount: order.total_amount,
      currency: order.currency,
      customerEmail: order.customer.email,
    });
  }

  // Subscription payment (initial or renewal)
  const planId = getPlanIdFromPolarProduct(order.product_id);

  if (!planId) {
    log.error("Polar webhook: unknown subscription product", {
      productId: order.product_id,
    });
    return NextResponse.json(
      { message: "Unknown subscription product", ok: false },
      { status: 400 }
    );
  }

  const isRenewal = isSubscriptionRenewal(order);
  const isInitial = isSubscriptionCreate(order);

  return handleSubscriptionPayment({
    profileId,
    planId,
    orderId,
    amount: order.total_amount,
    currency: order.currency,
    isRenewal,
    isInitial,
    subscriptionId: order.subscription_id,
    customerEmail: order.customer.email,
  });
}

/**
 * Handle subscription payment (initial or renewal)
 */
async function handleSubscriptionPayment(params: {
  profileId: string;
  planId: PlanId;
  orderId: string;
  amount: number;
  currency: string;
  isRenewal: boolean;
  isInitial: boolean;
  subscriptionId: string | null;
  customerEmail: string;
}): Promise<Response> {
  const {
    profileId,
    planId,
    orderId,
    amount,
    currency,
    isRenewal,
    subscriptionId,
  } = params;

  // Validate plan
  const plan = getPlan(planId);
  if (!plan) {
    log.error("Polar webhook: invalid plan", { planId });
    return NextResponse.json(
      { message: "Invalid plan", ok: false },
      { status: 400 }
    );
  }

  // Convert amount from cents to dollars
  const amountInDollars = amount / 100;

  // Create payment record
  await database.payment.create({
    data: {
      profileId,
      amount: amountInDollars,
      currency: currency.toUpperCase() === "USD" ? "USD" : "VND",
      provider: "polar",
      providerTransactionId: orderId,
      providerOrderId: subscriptionId,
      status: "completed",
      paymentType: "subscription",
      plan: planId,
      packId: null,
      metadata: {
        isRenewal,
        polarSubscriptionId: subscriptionId,
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

  log.info("Polar credits allocated", {
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
        provider: "polar",
        amount: amountInDollars,
        currency: currency.toUpperCase(),
        creditsAllocated: creditAllocation.creditsAllocated,
        source: "webhook",
        polarSubscriptionId: subscriptionId,
      },
    });
  }

  await analytics.shutdown();

  log.info("Polar subscription payment processed", {
    profileId,
    planId,
    orderId,
    isRenewal,
  });

  return NextResponse.json({ message: "Success", ok: true });
}

/**
 * Handle credit pack purchase (one-time)
 */
async function handlePackPurchase(params: {
  profileId: string;
  packId: string;
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
}): Promise<Response> {
  const { profileId, packId, orderId, amount, currency } = params;

  // Convert amount from cents to dollars
  const amountInDollars = amount / 100;

  // Create payment record
  await database.payment.create({
    data: {
      profileId,
      amount: amountInDollars,
      currency: currency.toUpperCase() === "USD" ? "USD" : "VND",
      provider: "polar",
      providerTransactionId: orderId,
      providerOrderId: null,
      status: "completed",
      paymentType: "credit_pack",
      plan: null,
      packId,
      metadata: {},
    },
  });

  // Finalize credit pack purchase
  const packResult = await finalizeCreditPackPurchase(profileId, packId, {
    provider: "polar",
    transactionId: orderId,
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
        provider: "polar",
        amount: amountInDollars,
        currency: currency.toUpperCase(),
        creditsAdded: packResult.creditsAdded,
        source: "webhook",
      },
    });
  }

  await analytics.shutdown();

  log.info("Polar pack purchase processed", {
    profileId,
    packId,
    creditsAdded: packResult.creditsAdded,
    orderId,
  });

  return NextResponse.json({ message: "Success", ok: true });
}

/**
 * Handle subscription.active event
 * This is fired when a subscription becomes active
 * We may have already activated via order.paid, so this is mainly for confirmation
 */
function handleSubscriptionActive(subscription: PolarSubscription): Response {
  log.info("Polar subscription active", {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer_id,
    periodStart: subscription.current_period_start,
    periodEnd: subscription.current_period_end,
  });

  // Most activation logic is handled in order.paid
  // This event can be used for additional logging or confirmation

  return NextResponse.json({ message: "Acknowledged", ok: true });
}

/**
 * Handle subscription.canceled event
 * User has canceled but subscription is still active until period end
 */
async function handleSubscriptionCanceled(
  subscription: PolarSubscription
): Promise<Response> {
  log.info("Polar subscription canceled", {
    subscriptionId: subscription.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at,
  });

  // Find the profile by looking up recent payments with this subscription ID
  const payment = await database.payment.findFirst({
    where: {
      provider: "polar",
      providerOrderId: subscription.id,
    },
    select: { profileId: true },
  });

  if (payment) {
    // Update profile metadata to indicate pending cancellation
    await database.profile.update({
      where: { id: payment.profileId },
      data: {
        metadata: {
          polarCancelAtPeriodEnd: true,
          polarCanceledAt: subscription.canceled_at,
        },
      },
    });

    log.info("Polar subscription marked for cancellation", {
      profileId: payment.profileId,
      subscriptionId: subscription.id,
    });
  }

  return NextResponse.json({ message: "Acknowledged", ok: true });
}

/**
 * Handle subscription.revoked event
 * Subscription has been permanently revoked (end of period after cancellation)
 */
async function handleSubscriptionRevoked(
  subscription: PolarSubscription
): Promise<Response> {
  log.info("Polar subscription revoked", {
    subscriptionId: subscription.id,
    endedAt: subscription.ended_at,
  });

  // Find the profile
  const payment = await database.payment.findFirst({
    where: {
      provider: "polar",
      providerOrderId: subscription.id,
    },
    select: { profileId: true },
  });

  if (payment) {
    // Cancel the subscription in our system
    await cancelSubscription(payment.profileId);

    // Track analytics
    const profile = await database.profile.findUnique({
      where: { id: payment.profileId },
      select: { clerkUserId: true },
    });

    if (profile) {
      analytics.capture({
        event: "Subscription Expired",
        distinctId: profile.clerkUserId,
        properties: {
          provider: "polar",
          source: "webhook",
          polarSubscriptionId: subscription.id,
        },
      });

      await analytics.shutdown();
    }

    log.info("Polar subscription expired", {
      profileId: payment.profileId,
      subscriptionId: subscription.id,
    });
  }

  return NextResponse.json({ message: "Acknowledged", ok: true });
}
