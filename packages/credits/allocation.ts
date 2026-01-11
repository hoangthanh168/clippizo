import "server-only";
import { database } from "@repo/database";
import {
  getPlan,
  getPlanDuration,
  getPlanRolloverCap,
  getYearlyCredits,
  type BillingPeriod,
} from "@repo/payments";

export type AllocationResult = {
  creditsAllocated: number;
  totalBalance: number;
  sourceId: string;
  transactionId: string;
};

/**
 * Allocate monthly credits for a subscription
 * Respects rollover cap - won't allocate beyond max balance
 */
export async function allocateMonthlyCredits(
  profileId: string,
  planId: string,
  options?: {
    billingCycleStart?: Date;
    durationDays?: number;
  }
): Promise<AllocationResult> {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const now = new Date();
  const billingCycleStart = options?.billingCycleStart ?? now;
  const durationDays = options?.durationDays ?? getPlanDuration(plan.id, "monthly");
  const expiresAt = new Date(
    billingCycleStart.getTime() + durationDays * 24 * 60 * 60 * 1000
  );

  return database.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.creditSource.aggregate({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      _sum: { amount: true },
    });

    const existingBalance = currentBalance._sum.amount ?? 0;
    const rolloverCap = getPlanRolloverCap(plan.id);
    const monthlyCredits = plan.monthlyCredits;

    // Calculate how many credits to actually allocate (respecting cap)
    const potentialNewBalance = existingBalance + monthlyCredits;
    const actualAllocation =
      potentialNewBalance > rolloverCap
        ? Math.max(0, rolloverCap - existingBalance)
        : monthlyCredits;

    const newTotalBalance = existingBalance + actualAllocation;

    // Create credit source
    const creditSource = await tx.creditSource.create({
      data: {
        profileId,
        type: "monthly",
        amount: actualAllocation,
        initialAmount: monthlyCredits,
        expiresAt,
        billingCycleStart,
      },
    });

    // Determine description based on allocation
    let description = `Monthly credit allocation for ${plan.name} plan`;
    if (actualAllocation < monthlyCredits) {
      if (actualAllocation === 0) {
        description += " (at rollover cap)";
      } else {
        description += " (rollover cap applied)";
      }
    }

    // Log transaction
    const transaction = await tx.creditTransaction.create({
      data: {
        profileId,
        type: "allocation",
        amount: actualAllocation,
        balanceAfter: newTotalBalance,
        sourceId: creditSource.id,
        description,
        metadata: {
          planId: plan.id,
          originalAmount: monthlyCredits,
          rolloverCapApplied: actualAllocation < monthlyCredits,
        },
      },
    });

    return {
      creditsAllocated: actualAllocation,
      totalBalance: newTotalBalance,
      sourceId: creditSource.id,
      transactionId: transaction.id,
    };
  });
}

/**
 * Allocate yearly credits for a subscription
 * All credits are given upfront with 365-day expiry (no rollover cap)
 */
export async function allocateYearlyCredits(
  profileId: string,
  planId: string,
  options?: {
    billingCycleStart?: Date;
  }
): Promise<AllocationResult> {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const now = new Date();
  const billingCycleStart = options?.billingCycleStart ?? now;
  const durationDays = 365;
  const expiresAt = new Date(
    billingCycleStart.getTime() + durationDays * 24 * 60 * 60 * 1000
  );

  const yearlyCredits = getYearlyCredits(plan.id);

  return database.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.creditSource.aggregate({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      _sum: { amount: true },
    });

    const existingBalance = currentBalance._sum.amount ?? 0;
    // For yearly plans, no rollover cap - user pays upfront for all credits
    const newTotalBalance = existingBalance + yearlyCredits;

    // Create credit source
    const creditSource = await tx.creditSource.create({
      data: {
        profileId,
        type: "monthly", // Could add "yearly" enum if needed
        amount: yearlyCredits,
        initialAmount: yearlyCredits,
        expiresAt,
        billingCycleStart,
      },
    });

    const description = `Yearly credit allocation for ${plan.name} plan (${yearlyCredits.toLocaleString()} credits)`;

    // Log transaction
    const transaction = await tx.creditTransaction.create({
      data: {
        profileId,
        type: "allocation",
        amount: yearlyCredits,
        balanceAfter: newTotalBalance,
        sourceId: creditSource.id,
        description,
        metadata: {
          planId: plan.id,
          billingPeriod: "yearly",
          originalAmount: yearlyCredits,
        },
      },
    });

    return {
      creditsAllocated: yearlyCredits,
      totalBalance: newTotalBalance,
      sourceId: creditSource.id,
      transactionId: transaction.id,
    };
  });
}

/**
 * Allocate credits for a new subscription activation
 */
export async function allocateCreditsOnSubscriptionActivation(
  profileId: string,
  planId: string,
  subscriptionExpiresAt: Date,
  billingPeriod: BillingPeriod = "monthly"
): Promise<AllocationResult> {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const now = new Date();

  // For yearly subscriptions, allocate all credits upfront
  if (billingPeriod === "yearly") {
    return allocateYearlyCredits(profileId, planId, {
      billingCycleStart: now,
    });
  }

  // For monthly, calculate duration and allocate
  const durationDays = Math.ceil(
    (subscriptionExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  return allocateMonthlyCredits(profileId, planId, {
    billingCycleStart: now,
    durationDays,
  });
}
