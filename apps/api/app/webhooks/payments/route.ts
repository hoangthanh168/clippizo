import { analytics } from "@repo/analytics/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import type { Stripe } from "@repo/payments";
import { stripe } from "@repo/payments";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";

// Get profile from database by Stripe customer ID
const getProfileFromCustomerId = async (customerId: string) => {
  return database.profile.findUnique({
    where: { stripeCustomerId: customerId },
  });
};

const handleCheckoutSessionCompleted = async (
  data: Stripe.Checkout.Session
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === "string" ? data.customer : data.customer.id;

  // Get subscription details
  const subscriptionId = typeof data.subscription === "string"
    ? data.subscription
    : data.subscription?.id;

  // Update profile with subscription info
  const profile = await database.profile.update({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionId,
      subscriptionStatus: "active",
      billingEmail: data.customer_email,
    },
  });

  if (!profile) {
    log.warn("Profile not found for customer", { customerId });
    return;
  }

  analytics.capture({
    event: "User Subscribed",
    distinctId: profile.clerkUserId,
  });
};

const handleSubscriptionScheduleCanceled = async (
  data: Stripe.SubscriptionSchedule
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === "string" ? data.customer : data.customer.id;

  // Update profile subscription status
  const profile = await database.profile.update({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: "canceled",
    },
  });

  if (!profile) {
    log.warn("Profile not found for customer", { customerId });
    return;
  }

  analytics.capture({
    event: "User Unsubscribed",
    distinctId: profile.clerkUserId,
  });
};

export const POST = async (request: Request): Promise<Response> => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  try {
    const body = await request.text();
    const headerPayload = await headers();
    const signature = headerPayload.get("stripe-signature");

    if (!signature) {
      throw new Error("missing stripe-signature header");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }
      case "subscription_schedule.canceled": {
        await handleSubscriptionScheduleCanceled(event.data.object);
        break;
      }
      default: {
        log.warn(`Unhandled event type ${event.type}`);
      }
    }

    await analytics.shutdown();

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    const message = parseError(error);

    log.error(message);

    return NextResponse.json(
      {
        message: "something went wrong",
        ok: false,
      },
      { status: 500 }
    );
  }
};
