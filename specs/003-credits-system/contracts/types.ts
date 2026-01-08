/**
 * Credits System Type Definitions
 * Feature: 003-credits-system
 *
 * These types are derived from the API contract and data model.
 * Implementation should match these interfaces exactly.
 */

// ===========================================
// Credit Source Types
// ===========================================

export type CreditSourceType = "monthly" | "pack";

export interface CreditSource {
  id: string;
  profileId: string;
  type: CreditSourceType;
  amount: number;
  initialAmount: number;
  expiresAt: Date;
  packId?: string;
  billingCycleStart?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// Transaction Types
// ===========================================

export type TransactionType =
  | "allocation"
  | "pack_purchase"
  | "consumption"
  | "expiration"
  | "adjustment";

export interface CreditTransaction {
  id: string;
  profileId: string;
  type: TransactionType;
  amount: number; // Positive for additions, negative for deductions
  balanceAfter: number;
  operation?: string;
  sourceId?: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ===========================================
// Credit Operations
// ===========================================

export type CreditOperation =
  | "image-gen-basic"
  | "image-gen-premium"
  | "video-gen-short"
  | "video-gen-long"
  | "chatbot-message";

export interface CreditCost {
  operation: CreditOperation;
  credits: number;
  description: string;
}

// ===========================================
// Credit Pack Types
// ===========================================

export type CreditPackId = "small" | "medium" | "large";

export interface CreditPack {
  id: CreditPackId;
  name: string;
  credits: number;
  priceUSD: number;
  priceVND: number;
  validityDays: number;
}

// ===========================================
// API Request/Response Types
// ===========================================

export interface CreditBalanceBreakdown {
  monthly?: {
    amount: number;
    expiresAt: Date;
  };
  pack?: {
    amount: number;
    expiresAt: Date;
  };
}

export interface CreditBalance {
  total: number;
  breakdown: CreditBalanceBreakdown;
  isLow: boolean;
  expiringCredits?: {
    amount: number;
    expiresAt: Date;
  };
}

export interface ConsumeCreditsRequest {
  operation: CreditOperation;
  metadata?: Record<string, unknown>;
}

export interface ConsumeCreditsResponse {
  success: boolean;
  creditsUsed: number;
  remainingBalance: number;
  transactionId: string;
  isLow: boolean;
}

export interface TransactionHistoryParams {
  limit?: number;
  offset?: number;
  type?: TransactionType;
}

export interface TransactionHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
  hasMore: boolean;
}

export interface PurchasePackRequest {
  packId: CreditPackId;
  provider: "paypal" | "sepay";
}

export interface PurchasePackResponse {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  qrCode?: string;
}

// ===========================================
// Plan Extension Types
// ===========================================

export interface SubscriptionPlanCredits {
  monthlyCredits: number;
  rolloverCapMultiplier: number;
}

// ===========================================
// Error Types
// ===========================================

export class InsufficientCreditsError extends Error {
  constructor(
    public required: number,
    public available: number
  ) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

export class NoActiveSubscriptionError extends Error {
  constructor() {
    super("An active subscription is required to purchase credit packs");
    this.name = "NoActiveSubscriptionError";
  }
}

// ===========================================
// Zod Schemas (for runtime validation)
// ===========================================

// Note: Actual Zod schemas should be defined in the implementation
// These are the expected shapes:

/*
export const consumeCreditsSchema = z.object({
  operation: z.enum([
    "image-gen-basic",
    "image-gen-premium",
    "video-gen-short",
    "video-gen-long",
    "chatbot-message",
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export const purchasePackSchema = z.object({
  packId: z.enum(["small", "medium", "large"]),
  provider: z.enum(["paypal", "sepay"]),
});

export const transactionHistorySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.enum([
    "allocation",
    "pack_purchase",
    "consumption",
    "expiration",
    "adjustment",
  ]).optional(),
});
*/
