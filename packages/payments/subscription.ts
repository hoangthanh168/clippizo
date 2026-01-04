import "server-only";
import { database } from "@repo/database";
import { type PlanId, PLANS, isPaidPlan } from "./plans";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | null;

export interface SubscriptionInfo {
  plan: PlanId;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  isActive: boolean;
  canCreate: boolean;
  features: string[];
  daysRemaining: number | null;
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
  const isActive =
    plan === "free" || (actualStatus === "active" && !isExpired);
  const canCreate = plan === "free" || isActive;

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (expiresAt && !isExpired) {
    daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    plan,
    status: actualStatus,
    expiresAt,
    isActive,
    canCreate,
    features: PLANS[plan]?.features ?? PLANS.free.features,
    daysRemaining,
  };
}

export interface ActivateSubscriptionParams {
  profileId: string;
  planId: PlanId;
  isRenewal?: boolean;
}

export async function activateSubscription(
  params: ActivateSubscriptionParams
): Promise<void> {
  const { profileId, planId, isRenewal } = params;

  if (!isPaidPlan(planId)) {
    throw new Error("Cannot activate free plan");
  }

  const plan = PLANS[planId];
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
    newExpiresAt.setDate(newExpiresAt.getDate() + plan.durationDays);
  } else {
    // New subscription: start from now
    newExpiresAt = new Date(now);
    newExpiresAt.setDate(newExpiresAt.getDate() + plan.durationDays);
  }

  await database.profile.update({
    where: { id: profileId },
    data: {
      plan: planId,
      subscriptionStatus: "active",
      subscriptionExpiresAt: newExpiresAt,
    },
  });
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
