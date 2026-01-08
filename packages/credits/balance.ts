import "server-only";
import { database } from "@repo/database";
import { getPlan } from "@repo/payments";
import type { CreditBalance, CreditBalanceBreakdown } from "./types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LOW_BALANCE_THRESHOLD = 0.2; // 20%

/**
 * Get total available credits for a profile
 */
export async function getTotalBalance(profileId: string): Promise<number> {
  const result = await database.creditSource.aggregate({
    where: {
      profileId,
      amount: { gt: 0 },
      expiresAt: { gt: new Date() },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? 0;
}

/**
 * Get credit balance with breakdown by source type
 */
export async function getCreditsBalance(
  profileId: string
): Promise<CreditBalance> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + SEVEN_DAYS_MS);

  // Get all active credit sources
  const creditSources = await database.creditSource.findMany({
    where: {
      profileId,
      amount: { gt: 0 },
      expiresAt: { gt: now },
    },
    orderBy: [{ type: "asc" }, { expiresAt: "asc" }],
  });

  // Calculate breakdown
  const breakdown: CreditBalanceBreakdown = {};
  let total = 0;

  for (const source of creditSources) {
    total += source.amount;

    if (source.type === "monthly") {
      if (!breakdown.monthly) {
        breakdown.monthly = { amount: 0, expiresAt: source.expiresAt };
      }
      breakdown.monthly.amount += source.amount;
      // Use the earliest expiration for display
      if (source.expiresAt < breakdown.monthly.expiresAt) {
        breakdown.monthly.expiresAt = source.expiresAt;
      }
    } else if (source.type === "pack") {
      if (!breakdown.pack) {
        breakdown.pack = { amount: 0, expiresAt: source.expiresAt };
      }
      breakdown.pack.amount += source.amount;
      // Use the earliest expiration for display
      if (source.expiresAt < breakdown.pack.expiresAt) {
        breakdown.pack.expiresAt = source.expiresAt;
      }
    }
  }

  // Check for expiring credits (within 7 days)
  const expiringCredits = creditSources
    .filter((s) => s.expiresAt <= sevenDaysFromNow)
    .reduce((sum, s) => sum + s.amount, 0);

  // Get user's plan to determine low balance threshold
  const profile = await database.profile.findUnique({
    where: { id: profileId },
    select: { plan: true },
  });

  const plan = getPlan(profile?.plan ?? "free");
  const monthlyCredits = plan?.monthlyCredits ?? 50;
  const isLow = total < monthlyCredits * LOW_BALANCE_THRESHOLD;

  const result: CreditBalance = {
    total,
    breakdown,
    isLow,
  };

  if (expiringCredits > 0) {
    const earliestExpiring = creditSources
      .filter((s) => s.expiresAt <= sevenDaysFromNow)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0];

    if (earliestExpiring) {
      result.expiringCredits = {
        amount: expiringCredits,
        expiresAt: earliestExpiring.expiresAt,
      };
    }
  }

  return result;
}

/**
 * Check if a profile has sufficient credits for an operation
 */
export async function hasSufficientCredits(
  profileId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getTotalBalance(profileId);
  return balance >= requiredCredits;
}
