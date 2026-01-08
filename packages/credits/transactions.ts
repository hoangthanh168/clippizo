import "server-only";
import { database, type Prisma } from "@repo/database";
import type {
  CreditTransaction,
  TransactionHistoryParams,
  TransactionHistoryResponse,
  TransactionType,
} from "./types";

/**
 * Create a credit transaction log entry
 */
export async function createTransaction(
  profileId: string,
  data: {
    type: TransactionType;
    amount: number;
    balanceAfter: number;
    operation?: string;
    sourceId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<CreditTransaction> {
  const transaction = await database.creditTransaction.create({
    data: {
      profileId,
      type: data.type,
      amount: data.amount,
      balanceAfter: data.balanceAfter,
      operation: data.operation,
      sourceId: data.sourceId,
      description: data.description,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return {
    id: transaction.id,
    profileId: transaction.profileId,
    type: transaction.type as TransactionType,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    operation: transaction.operation,
    sourceId: transaction.sourceId,
    description: transaction.description,
    metadata: transaction.metadata as Record<string, unknown>,
    createdAt: transaction.createdAt,
  };
}

/**
 * Get transaction history for a profile with pagination
 */
export async function getTransactionHistory(
  profileId: string,
  params: TransactionHistoryParams = {}
): Promise<TransactionHistoryResponse> {
  const { limit = 20, offset = 0, type } = params;

  const where = {
    profileId,
    ...(type && { type }),
  };

  const [transactions, total] = await Promise.all([
    database.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    database.creditTransaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      profileId: t.profileId,
      type: t.type as TransactionType,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      operation: t.operation,
      sourceId: t.sourceId,
      description: t.description,
      metadata: t.metadata as Record<string, unknown>,
      createdAt: t.createdAt,
    })),
    total,
    hasMore: offset + transactions.length < total,
  };
}

/**
 * Get recent transactions for a profile
 */
export async function getRecentTransactions(
  profileId: string,
  limit = 10
): Promise<CreditTransaction[]> {
  const result = await getTransactionHistory(profileId, { limit });
  return result.transactions;
}
