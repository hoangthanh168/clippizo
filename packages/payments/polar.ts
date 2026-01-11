import "server-only";
import { Polar } from "@polar-sh/sdk";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { keys } from "./keys";
import type { BillingPeriod, PlanId } from "./plans";

// biome-ignore lint/performance/noBarrelFile: required for package exports
export { WebhookVerificationError } from "@polar-sh/sdk/webhooks";

// ===========================================
// Types
// ===========================================

export type CreditPackId =
  | "starter"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "enterprise";

export type PolarBillingReason =
  | "purchase"
  | "subscription_create"
  | "subscription_cycle"
  | "subscription_update";

export type PolarCustomer = {
  id: string;
  email: string;
  name: string | null;
  external_id: string | null;
};

export type PolarProduct = {
  id: string;
  name: string;
  is_recurring: boolean;
};

export type PolarSubscription = {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
  customer_id: string;
  product_id: string;
};

export type PolarOrder = {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  billing_reason: PolarBillingReason;
  customer_id: string;
  product_id: string;
  subscription_id: string | null;
  customer: PolarCustomer;
  product: PolarProduct;
  subscription: PolarSubscription | null;
};

export type PolarWebhookEvent = {
  type: string;
  timestamp: string;
  data: PolarOrder | PolarSubscription;
};

export interface PolarOrderPaidEvent extends PolarWebhookEvent {
  type: "order.paid";
  data: PolarOrder;
}

export interface PolarSubscriptionActiveEvent extends PolarWebhookEvent {
  type: "subscription.active";
  data: PolarSubscription;
}

export interface PolarSubscriptionCanceledEvent extends PolarWebhookEvent {
  type: "subscription.canceled";
  data: PolarSubscription;
}

export interface PolarSubscriptionRevokedEvent extends PolarWebhookEvent {
  type: "subscription.revoked";
  data: PolarSubscription;
}

// ===========================================
// Client
// ===========================================

let polarClient: Polar | null = null;

function getPolarClient(): Polar {
  if (polarClient) {
    return polarClient;
  }

  const env = keys();

  if (!env.POLAR_ACCESS_TOKEN) {
    throw new Error("Polar access token not configured");
  }

  polarClient = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: env.POLAR_MODE === "production" ? "production" : "sandbox",
  });

  return polarClient;
}

// ===========================================
// Product ID Mapping
// ===========================================

function getPolarProductId(
  planId: PlanId,
  billingPeriod: BillingPeriod = "monthly"
): string {
  const env = keys();

  const productMap: Record<PlanId, Record<BillingPeriod, string | undefined>> = {
    free: { monthly: undefined, yearly: undefined },
    pro: {
      monthly: env.POLAR_PRODUCT_PRO,
      yearly: env.POLAR_PRODUCT_PRO_YEARLY,
    },
    enterprise: {
      monthly: env.POLAR_PRODUCT_ENTERPRISE,
      yearly: env.POLAR_PRODUCT_ENTERPRISE_YEARLY,
    },
  };

  const productId = productMap[planId][billingPeriod];
  if (!productId) {
    throw new Error(
      `Polar product ID not configured for plan: ${planId} (${billingPeriod})`
    );
  }

  return productId;
}

function getPolarPackProductId(packId: CreditPackId): string {
  const env = keys();

  const productMap: Record<CreditPackId, string | undefined> = {
    starter: env.POLAR_PRODUCT_PACK_STARTER,
    small: env.POLAR_PRODUCT_PACK_SMALL,
    medium: env.POLAR_PRODUCT_PACK_MEDIUM,
    large: env.POLAR_PRODUCT_PACK_LARGE,
    xlarge: env.POLAR_PRODUCT_PACK_XLARGE,
    enterprise: env.POLAR_PRODUCT_PACK_ENTERPRISE,
  };

  const productId = productMap[packId];
  if (!productId) {
    throw new Error(`Polar product ID not configured for pack: ${packId}`);
  }

  return productId;
}

export type PlanFromProductResult = {
  planId: PlanId;
  billingPeriod: BillingPeriod;
};

/**
 * Get plan ID and billing period from Polar product ID (reverse mapping)
 */
export function getPlanIdFromPolarProduct(
  productId: string
): PlanFromProductResult | null {
  const env = keys();

  // Monthly products
  if (productId === env.POLAR_PRODUCT_PRO) {
    return { planId: "pro", billingPeriod: "monthly" };
  }
  if (productId === env.POLAR_PRODUCT_ENTERPRISE) {
    return { planId: "enterprise", billingPeriod: "monthly" };
  }

  // Yearly products
  if (productId === env.POLAR_PRODUCT_PRO_YEARLY) {
    return { planId: "pro", billingPeriod: "yearly" };
  }
  if (productId === env.POLAR_PRODUCT_ENTERPRISE_YEARLY) {
    return { planId: "enterprise", billingPeriod: "yearly" };
  }

  return null;
}

/**
 * Get pack ID from Polar product ID (reverse mapping)
 */
export function getPackIdFromPolarProduct(
  productId: string
): CreditPackId | null {
  const env = keys();

  if (productId === env.POLAR_PRODUCT_PACK_STARTER) {
    return "starter";
  }
  if (productId === env.POLAR_PRODUCT_PACK_SMALL) {
    return "small";
  }
  if (productId === env.POLAR_PRODUCT_PACK_MEDIUM) {
    return "medium";
  }
  if (productId === env.POLAR_PRODUCT_PACK_LARGE) {
    return "large";
  }
  if (productId === env.POLAR_PRODUCT_PACK_XLARGE) {
    return "xlarge";
  }
  if (productId === env.POLAR_PRODUCT_PACK_ENTERPRISE) {
    return "enterprise";
  }

  return null;
}

// ===========================================
// Subscription Checkout
// ===========================================

export type CreatePolarCheckoutParams = {
  planId: PlanId;
  billingPeriod: BillingPeriod;
  profileId: string;
  successUrl: string;
};

export type CreatePolarCheckoutResult = {
  checkoutUrl: string;
  checkoutId: string;
};

/**
 * Create a Polar checkout session for subscription
 */
export async function createPolarCheckout(
  params: CreatePolarCheckoutParams
): Promise<CreatePolarCheckoutResult> {
  const { planId, billingPeriod, profileId, successUrl } = params;

  const polar = getPolarClient();
  const productId = getPolarProductId(planId, billingPeriod);

  const checkout = await polar.checkouts.create({
    products: [productId],
    externalCustomerId: profileId,
    successUrl,
  });

  if (!checkout.url) {
    throw new Error("Failed to create Polar checkout: no URL returned");
  }

  return {
    checkoutUrl: checkout.url,
    checkoutId: checkout.id,
  };
}

// ===========================================
// Credit Pack Checkout (One-time)
// ===========================================

export type CreatePolarPackCheckoutParams = {
  packId: CreditPackId;
  profileId: string;
  successUrl: string;
};

export type CreatePolarPackCheckoutResult = {
  checkoutUrl: string;
  checkoutId: string;
};

/**
 * Create a Polar checkout session for credit pack (one-time purchase)
 */
export async function createPolarPackCheckout(
  params: CreatePolarPackCheckoutParams
): Promise<CreatePolarPackCheckoutResult> {
  const { packId, profileId, successUrl } = params;

  const polar = getPolarClient();
  const productId = getPolarPackProductId(packId);

  const checkout = await polar.checkouts.create({
    products: [productId],
    externalCustomerId: profileId,
    successUrl,
  });

  if (!checkout.url) {
    throw new Error("Failed to create Polar pack checkout: no URL returned");
  }

  return {
    checkoutUrl: checkout.url,
    checkoutId: checkout.id,
  };
}

// ===========================================
// Webhook Verification
// ===========================================

/**
 * Verify and parse Polar webhook
 */
export function verifyPolarWebhook(
  body: string | Buffer,
  headers: Record<string, string>,
  secret: string
): PolarWebhookEvent {
  const event = validateEvent(body, headers, secret);
  // Convert the SDK event to our internal type
  // Cast through unknown as SDK types don't perfectly match our internal types
  return {
    type: event.type,
    timestamp:
      event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : String(event.timestamp),
    data: event.data as unknown as PolarOrder | PolarSubscription,
  };
}

// ===========================================
// Webhook Event Type Guards
// ===========================================

export function isOrderPaidEvent(
  event: PolarWebhookEvent
): event is PolarOrderPaidEvent {
  return event.type === "order.paid";
}

export function isSubscriptionActiveEvent(
  event: PolarWebhookEvent
): event is PolarSubscriptionActiveEvent {
  return event.type === "subscription.active";
}

export function isSubscriptionCanceledEvent(
  event: PolarWebhookEvent
): event is PolarSubscriptionCanceledEvent {
  return event.type === "subscription.canceled";
}

export function isSubscriptionRevokedEvent(
  event: PolarWebhookEvent
): event is PolarSubscriptionRevokedEvent {
  return event.type === "subscription.revoked";
}

/**
 * Check if order is a one-time purchase (not subscription)
 */
export function isOneTimePurchase(order: PolarOrder): boolean {
  return order.billing_reason === "purchase";
}

/**
 * Check if order is a subscription creation
 */
export function isSubscriptionCreate(order: PolarOrder): boolean {
  return order.billing_reason === "subscription_create";
}

/**
 * Check if order is a subscription renewal
 */
export function isSubscriptionRenewal(order: PolarOrder): boolean {
  return order.billing_reason === "subscription_cycle";
}

// ===========================================
// Customer Portal
// ===========================================

/**
 * Get Polar customer portal URL for managing subscriptions
 * User will be redirected here to cancel/manage their subscription
 */
export function getPolarCustomerPortalUrl(): string {
  const env = keys();
  const baseUrl =
    env.POLAR_MODE === "production"
      ? "https://polar.sh"
      : "https://sandbox.polar.sh";

  return `${baseUrl}/purchases/subscriptions`;
}
