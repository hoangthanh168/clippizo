import "server-only";
import { database } from "@repo/database";
import { NoActiveSubscriptionError } from "./errors";
import { calculatePackExpirationDate } from "./expiration";
import { getCreditPack, isValidPackId } from "./packs";
import type { CreditPackId } from "./types";

// Transaction client type - subset of database methods available in transaction
type TransactionClient = {
  profile: typeof database.profile;
  creditSource: typeof database.creditSource;
  creditTransaction: typeof database.creditTransaction;
};

export type PurchaseCreditPackResult = {
  success: boolean;
  creditsAdded: number;
  totalBalance: number;
  sourceId: string;
  expiresAt: Date;
  transactionId: string;
};

/**
 * Validate that profile has an active subscription
 * Pack purchases require an active subscription
 */
async function validateActiveSubscription(
  profileId: string,
  tx: TransactionClient
): Promise<void> {
  const profile = await tx.profile.findUnique({
    where: { id: profileId },
    select: { subscriptionStatus: true },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  // Only allow pack purchase if subscription is active
  const validStatuses = ["active", "trialing"];
  if (
    !(
      profile.subscriptionStatus &&
      validStatuses.includes(profile.subscriptionStatus)
    )
  ) {
    throw new NoActiveSubscriptionError();
  }
}

/**
 * Purchase a credit pack and add credits to the profile
 * Creates a CreditSource with type='pack' and 90-day expiration
 */
export async function purchaseCreditPack(
  profileId: string,
  packId: string
): Promise<PurchaseCreditPackResult> {
  // Validate pack ID
  if (!isValidPackId(packId)) {
    throw new Error(`Invalid pack ID: ${packId}`);
  }

  const pack = getCreditPack(packId as CreditPackId);
  const now = new Date();
  const expiresAt = calculatePackExpirationDate(now, pack.validityDays);

  return database.$transaction(async (tx) => {
    // Validate subscription status
    await validateActiveSubscription(profileId, tx);

    // Create credit source for the pack
    const creditSource = await tx.creditSource.create({
      data: {
        profileId,
        type: "pack",
        amount: pack.credits,
        initialAmount: pack.credits,
        expiresAt,
        packId: pack.id,
      },
    });

    // Calculate new total balance
    const balanceResult = await tx.creditSource.aggregate({
      where: {
        profileId,
        amount: { gt: 0 },
        expiresAt: { gt: now },
      },
      _sum: { amount: true },
    });

    const totalBalance = balanceResult._sum.amount ?? 0;

    // Create transaction log
    const transaction = await tx.creditTransaction.create({
      data: {
        profileId,
        type: "pack_purchase",
        amount: pack.credits,
        balanceAfter: totalBalance,
        sourceId: creditSource.id,
        description: `Purchased ${pack.name}`,
        metadata: {
          packId: pack.id,
          packName: pack.name,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return {
      success: true,
      creditsAdded: pack.credits,
      totalBalance,
      sourceId: creditSource.id,
      expiresAt,
      transactionId: transaction.id,
    };
  });
}

/**
 * Finalize pack purchase after payment confirmation
 * Called from payment webhooks
 */
export async function finalizeCreditPackPurchase(
  profileId: string,
  packId: string,
  paymentDetails: {
    provider: "paypal" | "sepay" | "polar";
    transactionId: string;
    orderId?: string;
  }
): Promise<PurchaseCreditPackResult> {
  const result = await purchaseCreditPack(profileId, packId);

  // Update the transaction with payment details
  await database.creditTransaction.update({
    where: { id: result.transactionId },
    data: {
      metadata: {
        packId,
        paymentProvider: paymentDetails.provider,
        paymentTransactionId: paymentDetails.transactionId,
        paymentOrderId: paymentDetails.orderId,
        expiresAt: result.expiresAt.toISOString(),
      },
    },
  });

  return result;
}
