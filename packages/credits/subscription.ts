import "server-only";
import { database, type Prisma } from "@repo/database";

export type CancellationCheckResult = {
  canUse: boolean;
  reason: string;
  expiresAt?: Date;
};

export type ForfeitResult = {
  success: boolean;
  creditsForfeited: number;
  transactionId?: string;
};

export type CancellationResult = {
  canUseUntil: Date | null;
  creditsForfeited: number;
  transactionId?: string;
};

const GRACE_PERIOD_DAYS = 3;

/**
 * Check if a user can still use credits after subscription cancellation
 * Credits can be used until the subscription period ends
 */
export async function canUseCreditsAfterCancellation(
  profileId: string
): Promise<CancellationCheckResult> {
  const profile = await database.profile.findUnique({
    where: { id: profileId },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!profile) {
    return { canUse: false, reason: "Profile not found" };
  }

  // Active or trialing subscriptions can always use credits
  if (
    profile.subscriptionStatus === "active" ||
    profile.subscriptionStatus === "trialing"
  ) {
    return { canUse: true, reason: "Subscription is active" };
  }

  // Cancelled subscriptions can use credits until expiration
  if (
    profile.subscriptionStatus === "cancelled" &&
    profile.subscriptionExpiresAt
  ) {
    const now = new Date();
    if (profile.subscriptionExpiresAt > now) {
      return {
        canUse: true,
        reason: "Credits available until end of billing period",
        expiresAt: profile.subscriptionExpiresAt,
      };
    }
    return {
      canUse: false,
      reason: "Subscription period has expired",
      expiresAt: profile.subscriptionExpiresAt,
    };
  }

  // Past due - check grace period
  if (
    profile.subscriptionStatus === "past_due" &&
    profile.subscriptionExpiresAt
  ) {
    const gracePeriodEnd = new Date(profile.subscriptionExpiresAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    const now = new Date();
    if (now <= gracePeriodEnd) {
      return {
        canUse: true,
        reason: `Payment past due - grace period until ${gracePeriodEnd.toLocaleDateString()}`,
        expiresAt: gracePeriodEnd,
      };
    }
    return {
      canUse: false,
      reason: "Grace period has expired",
      expiresAt: gracePeriodEnd,
    };
  }

  // No subscription or unknown status
  return { canUse: false, reason: "No active subscription" };
}

/**
 * Forfeit all remaining credits for a profile
 * Called when subscription ends without renewal
 */
export async function forfeitAllCredits(
  profileId: string,
  reason: "subscription_ended" | "payment_failed" | "manual_adjustment"
): Promise<ForfeitResult> {
  return database.$transaction(async (tx) => {
    const now = new Date();

    // Get all active credit sources
    const creditSources = await tx.creditSource.findMany({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
    });

    if (creditSources.length === 0) {
      return { success: true, creditsForfeited: 0 };
    }

    // Calculate total to forfeit
    const totalToForfeit = creditSources.reduce((sum, s) => sum + s.amount, 0);

    // Zero out all credit sources
    await tx.creditSource.updateMany({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      data: { amount: 0 },
    });

    // Log the forfeiture transaction
    const transaction = await tx.creditTransaction.create({
      data: {
        profileId,
        type: "expiration",
        amount: -totalToForfeit,
        balanceAfter: 0,
        description: getForfeatureDescription(reason),
        metadata: {
          reason,
          sourcesAffected: creditSources.map((s) => s.id),
          forfeitedAt: now.toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      creditsForfeited: totalToForfeit,
      transactionId: transaction.id,
    };
  });
}

/**
 * Handle subscription cancellation
 * Credits remain available until end of billing period
 */
export async function handleSubscriptionCancellation(
  profileId: string
): Promise<CancellationResult> {
  const profile = await database.profile.findUnique({
    where: { id: profileId },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  const now = new Date();

  // If subscription has already expired, forfeit credits immediately
  if (profile.subscriptionExpiresAt && profile.subscriptionExpiresAt <= now) {
    const forfeitResult = await forfeitAllCredits(
      profileId,
      "subscription_ended"
    );
    return {
      canUseUntil: null,
      creditsForfeited: forfeitResult.creditsForfeited,
      transactionId: forfeitResult.transactionId,
    };
  }

  // Otherwise, credits remain available until expiration
  return {
    canUseUntil: profile.subscriptionExpiresAt,
    creditsForfeited: 0,
  };
}

/**
 * Handle subscription end (after period expires)
 * Called by cron job or webhook when subscription period ends
 */
export async function handleSubscriptionEnded(
  profileId: string
): Promise<ForfeitResult> {
  return forfeitAllCredits(profileId, "subscription_ended");
}

/**
 * Handle payment failure with grace period
 * Credits remain usable for GRACE_PERIOD_DAYS days
 */
export async function handlePaymentFailure(
  profileId: string
): Promise<{ gracePeriodEnds: Date; creditsAvailable: number }> {
  const now = new Date();
  const gracePeriodEnds = new Date(now);
  gracePeriodEnds.setDate(gracePeriodEnds.getDate() + GRACE_PERIOD_DAYS);

  // Get current balance
  const balanceResult = await database.creditSource.aggregate({
    where: {
      profileId,
      amount: { gt: 0 },
      expiresAt: { gt: now },
    },
    _sum: { amount: true },
  });

  return {
    gracePeriodEnds,
    creditsAvailable: balanceResult._sum.amount ?? 0,
  };
}

function getForfeatureDescription(
  reason: "subscription_ended" | "payment_failed" | "manual_adjustment"
): string {
  switch (reason) {
    case "subscription_ended":
      return "Credits forfeited - subscription ended";
    case "payment_failed":
      return "Credits forfeited - payment failed after grace period";
    case "manual_adjustment":
      return "Credits forfeited - manual adjustment";
    default:
      return "Credits forfeited";
  }
}
