import "server-only";
import { database } from "@repo/database";

/**
 * Calculate expiration date for monthly credits
 */
export function calculateMonthlyExpirationDate(
  billingCycleStart: Date,
  durationDays: number
): Date {
  return new Date(
    billingCycleStart.getTime() + durationDays * 24 * 60 * 60 * 1000
  );
}

/**
 * Calculate expiration date for a credit pack
 */
export function calculatePackExpirationDate(
  purchaseDate: Date,
  validityDays: number
): Date {
  return new Date(purchaseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
}

/**
 * Calculate how many credits can roll over based on cap
 */
export function calculateRolloverCredits(
  currentBalance: number,
  newAllocation: number,
  rolloverCap: number
): { creditsToRollover: number; creditsToExpire: number } {
  const potentialTotal = currentBalance + newAllocation;

  if (potentialTotal <= rolloverCap) {
    return {
      creditsToRollover: currentBalance,
      creditsToExpire: 0,
    };
  }

  // Need to expire some credits
  const excess = potentialTotal - rolloverCap;
  const creditsToExpire = Math.min(excess, currentBalance);
  const creditsToRollover = currentBalance - creditsToExpire;

  return {
    creditsToRollover,
    creditsToExpire,
  };
}

/**
 * Expire oldest monthly credits to enforce rollover cap
 * Only expires monthly credits, not pack credits
 */
export async function expireExcessCredits(
  profileId: string,
  excessAmount: number
): Promise<{ expiredCredits: number; affectedSources: string[] }> {
  const now = new Date();

  return database.$transaction(async (tx) => {
    // Get monthly credit sources, oldest first
    const monthlySources = await tx.creditSource.findMany({
      where: {
        profileId,
        type: "monthly",
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    let remainingToExpire = excessAmount;
    let expiredCredits = 0;
    const affectedSources: string[] = [];

    for (const source of monthlySources) {
      if (remainingToExpire <= 0) {
        break;
      }

      const toExpireFromSource = Math.min(source.amount, remainingToExpire);

      await tx.creditSource.update({
        where: { id: source.id },
        data: { amount: source.amount - toExpireFromSource },
      });

      affectedSources.push(source.id);
      expiredCredits += toExpireFromSource;
      remainingToExpire -= toExpireFromSource;
    }

    // Calculate new balance for transaction log
    const newBalance = await tx.creditSource.aggregate({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      _sum: { amount: true },
    });

    // Log the expiration
    if (expiredCredits > 0) {
      await tx.creditTransaction.create({
        data: {
          profileId,
          type: "expiration",
          amount: -expiredCredits,
          balanceAfter: newBalance._sum.amount ?? 0,
          description: "Credits expired due to rollover cap",
          metadata: {
            affectedSources,
            reason: "rollover_cap",
          },
        },
      });
    }

    return { expiredCredits, affectedSources };
  });
}

/**
 * Get credits expiring within a specific timeframe
 */
export async function getExpiringCredits(
  profileId: string,
  withinDays: number
): Promise<{ amount: number; expiresAt: Date | null }> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  const sources = await database.creditSource.findMany({
    where: {
      profileId,
      amount: { gt: 0 },
      expiresAt: {
        gt: now,
        lte: futureDate,
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  const totalExpiring = sources.reduce((sum, s) => sum + s.amount, 0);
  const earliestExpiration =
    sources.length > 0 ? (sources[0]?.expiresAt ?? null) : null;

  return {
    amount: totalExpiring,
    expiresAt: earliestExpiration,
  };
}
