import "server-only";
import { database } from "@repo/database";
import { getCreditCost, isValidOperation } from "./costs";
import {
  CreditOperationError,
  InsufficientCreditsError,
  NoActiveSubscriptionError,
} from "./errors";
import type { ConsumeCreditsResponse, CreditOperation } from "./types";

/**
 * Check if profile has valid subscription status for credit consumption
 */
async function validateSubscriptionStatus(profileId: string): Promise<void> {
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

  // Active or trialing subscriptions can always use credits
  if (
    profile.subscriptionStatus === "active" ||
    profile.subscriptionStatus === "trialing"
  ) {
    return;
  }

  // Cancelled subscriptions can use credits until expiration
  if (
    profile.subscriptionStatus === "cancelled" &&
    profile.subscriptionExpiresAt
  ) {
    if (profile.subscriptionExpiresAt > now) {
      return; // Still within billing period
    }
    throw new NoActiveSubscriptionError();
  }

  // Past due - check grace period (3 days)
  if (
    profile.subscriptionStatus === "past_due" &&
    profile.subscriptionExpiresAt
  ) {
    const gracePeriodEnd = new Date(profile.subscriptionExpiresAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
    if (now <= gracePeriodEnd) {
      return; // Still within grace period
    }
    throw new NoActiveSubscriptionError();
  }

  // No valid subscription
  throw new NoActiveSubscriptionError();
}

/**
 * Consume credits for an AI operation
 * Uses atomic transaction with pack-first FIFO ordering
 */
export async function consumeCredits(
  profileId: string,
  operation: CreditOperation,
  metadata?: Record<string, unknown>
): Promise<ConsumeCreditsResponse> {
  if (!isValidOperation(operation)) {
    throw new CreditOperationError(`Invalid operation: ${operation}`);
  }

  // Validate subscription status before consuming
  await validateSubscriptionStatus(profileId);

  const creditCost = getCreditCost(operation);

  return database.$transaction(async (tx) => {
    const now = new Date();

    // Get all active credit sources, ordered by type (pack first) then expiration (FIFO)
    const creditSources = await tx.creditSource.findMany({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      orderBy: [
        { type: "asc" }, // 'pack' < 'monthly' alphabetically
        { expiresAt: "asc" }, // Oldest expiring first
      ],
    });

    // Calculate total available
    const totalAvailable = creditSources.reduce((sum, s) => sum + s.amount, 0);

    if (totalAvailable < creditCost) {
      throw new InsufficientCreditsError(creditCost, totalAvailable);
    }

    // Deduct credits from sources (FIFO)
    let remainingToDeduct = creditCost;
    const affectedSources: string[] = [];

    for (const source of creditSources) {
      if (remainingToDeduct <= 0) {
        break;
      }

      const deductFromSource = Math.min(source.amount, remainingToDeduct);

      await tx.creditSource.update({
        where: { id: source.id },
        data: { amount: source.amount - deductFromSource },
      });

      affectedSources.push(source.id);
      remainingToDeduct -= deductFromSource;
    }

    // Calculate new balance
    const newBalance = totalAvailable - creditCost;

    // Log the transaction
    const transaction = await tx.creditTransaction.create({
      data: {
        profileId,
        type: "consumption",
        amount: -creditCost,
        balanceAfter: newBalance,
        operation,
        sourceId: affectedSources[0], // Primary source used
        description: `Credits consumed for ${operation}`,
        metadata: {
          ...metadata,
          affectedSources,
          creditCost,
        },
      },
    });

    // Check if balance is low (below 20% of typical monthly allocation)
    // We'll use a simple threshold check here
    const isLow = newBalance < 100; // 20% of 500 (pro plan)

    return {
      success: true,
      creditsUsed: creditCost,
      remainingBalance: newBalance,
      transactionId: transaction.id,
      isLow,
    };
  });
}

/**
 * Check if user has enough credits for an operation without consuming
 */
export async function canAffordOperation(
  profileId: string,
  operation: CreditOperation
): Promise<{ canAfford: boolean; available: number; required: number }> {
  if (!isValidOperation(operation)) {
    throw new CreditOperationError(`Invalid operation: ${operation}`);
  }

  const required = getCreditCost(operation);
  const now = new Date();

  const result = await database.creditSource.aggregate({
    where: {
      profileId,
      amount: { gt: 0 },
      expiresAt: { gt: now },
    },
    _sum: { amount: true },
  });

  const available = result._sum.amount ?? 0;

  return {
    canAfford: available >= required,
    available,
    required,
  };
}

/**
 * Reserve credits for an operation (without consuming)
 * Useful for pre-validation before expensive operations
 */
export async function validateCreditsForOperation(
  profileId: string,
  operation: CreditOperation
): Promise<void> {
  const { canAfford, available, required } = await canAffordOperation(
    profileId,
    operation
  );

  if (!canAfford) {
    throw new InsufficientCreditsError(required, available);
  }
}
