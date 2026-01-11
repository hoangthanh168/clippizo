import "server-only";
import { database } from "@repo/database";
import {
  getPlanDuration,
  isPaidPlan,
  PLANS,
  type BillingPeriod,
  type PlanId,
} from "./plans";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | null;
export type PaymentProvider = "paypal" | "sepay" | "polar" | null;

export interface SubscriptionInfo {
  plan: PlanId;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  isActive: boolean;
  canCreate: boolean;
  features: string[];
  daysRemaining: number | null;
  provider: PaymentProvider;
}

export async function getSubscriptionInfo(
  profileId: string
): Promise<SubscriptionInfo> {
  const profile = await database.profile.findUnique({
    where: { id: profileId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!profile) {
    return {
      plan: "free",
      status: null,
      expiresAt: null,
      isActive: false,
      canCreate: false,
      features: PLANS.free.features,
      daysRemaining: null,
      provider: null,
    };
  }

  const plan = (profile.plan as PlanId) || "free";
  const status = profile.subscriptionStatus as SubscriptionStatus;
  const expiresAt = profile.subscriptionExpiresAt;

  // Check if subscription is expired
  const now = new Date();
  const isExpired = expiresAt ? expiresAt < now : false;
  const actualStatus = isExpired ? "expired" : status;

  // Free plan is always active and can create
  const isActive = plan === "free" || (actualStatus === "active" && !isExpired);
  const canCreate = plan === "free" || isActive;

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (expiresAt && !isExpired) {
    daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Get payment provider from most recent subscription payment
  let provider: PaymentProvider = null;
  if (isPaidPlan(plan)) {
    const latestPayment = await database.payment.findFirst({
      where: {
        profileId,
        paymentType: "subscription",
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
      select: { provider: true },
    });
    provider = (latestPayment?.provider as PaymentProvider) ?? null;
  }

  return {
    plan,
    status: actualStatus,
    expiresAt,
    isActive,
    canCreate,
    features: PLANS[plan]?.features ?? PLANS.free.features,
    daysRemaining,
    provider,
  };
}

export interface ActivateSubscriptionParams {
  profileId: string;
  planId: PlanId;
  billingPeriod: BillingPeriod;
  isRenewal?: boolean;
}

export interface ActivateSubscriptionResult {
  expiresAt: Date;
  planId: PlanId;
  billingPeriod: BillingPeriod;
  isRenewal: boolean;
}

export async function activateSubscription(
  params: ActivateSubscriptionParams
): Promise<ActivateSubscriptionResult> {
  const { profileId, planId, billingPeriod, isRenewal = false } = params;

  if (!isPaidPlan(planId)) {
    throw new Error("Cannot activate free plan");
  }

  const durationDays = getPlanDuration(planId, billingPeriod);
  const now = new Date();

  // Get current subscription to calculate new expiry
  const profile = await database.profile.findUnique({
    where: { id: profileId },
    select: { subscriptionExpiresAt: true },
  });

  let newExpiresAt: Date;

  if (isRenewal && profile?.subscriptionExpiresAt) {
    // Renewal: extend from current expiry (preserves remaining days)
    const currentExpiry = profile.subscriptionExpiresAt;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
  } else {
    // New subscription: start from now
    newExpiresAt = new Date(now);
    newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
  }

  await database.profile.update({
    where: { id: profileId },
    data: {
      plan: planId,
      subscriptionStatus: "active",
      subscriptionExpiresAt: newExpiresAt,
    },
  });

  return {
    expiresAt: newExpiresAt,
    planId,
    billingPeriod,
    isRenewal,
  };
}

export async function cancelSubscription(profileId: string): Promise<void> {
  await database.profile.update({
    where: { id: profileId },
    data: {
      subscriptionStatus: "cancelled",
    },
  });
}

export async function getExpiringSubscriptions(
  daysBeforeExpiry: number
): Promise<
  Array<{
    id: string;
    email: string;
    plan: string;
    expiresAt: Date;
  }>
> {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

  const profiles = await database.profile.findMany({
    where: {
      subscriptionStatus: "active",
      subscriptionExpiresAt: {
        gte: now,
        lte: targetDate,
      },
    },
    select: {
      id: true,
      email: true,
      plan: true,
      subscriptionExpiresAt: true,
    },
  });

  return profiles.map((p) => ({
    id: p.id,
    email: p.email,
    plan: p.plan,
    expiresAt: p.subscriptionExpiresAt!,
  }));
}

export function isFeatureAllowed(
  subscription: SubscriptionInfo,
  feature: string
): boolean {
  return subscription.features.includes(feature);
}

export function canCreateContent(subscription: SubscriptionInfo): boolean {
  return subscription.canCreate;
}
