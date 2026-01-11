/**
 * Credits System Type Definitions
 */

// ===========================================
// Credit Source Types
// ===========================================

export type CreditSourceType = "monthly" | "pack";

export type CreditSource = {
  id: string;
  profileId: string;
  type: CreditSourceType;
  amount: number;
  initialAmount: number;
  expiresAt: Date;
  packId?: string | null;
  billingCycleStart?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ===========================================
// Transaction Types
// ===========================================

export type TransactionType =
  | "allocation"
  | "pack_purchase"
  | "consumption"
  | "expiration"
  | "adjustment";

export type CreditTransaction = {
  id: string;
  profileId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  operation?: string | null;
  sourceId?: string | null;
  description?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

// ===========================================
// Credit Operations
// ===========================================

export type CreditOperation =
  | "image-gen-basic"
  | "image-gen-premium"
  | "video-gen-short"
  | "video-gen-long"
  | "chatbot-message";

export type CreditCostConfig = {
  operation: CreditOperation;
  credits: number;
  description: string;
};

// ===========================================
// Credit Pack Types
// ===========================================

export type CreditPackId =
  | "starter"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "enterprise";

export type CreditPack = {
  id: CreditPackId;
  name: string;
  credits: number;
  priceUSD: number;
  validityDays: number;
};

// ===========================================
// API Request/Response Types
// ===========================================

export type CreditBalanceBreakdown = {
  monthly?: {
    amount: number;
    expiresAt: Date;
  };
  pack?: {
    amount: number;
    expiresAt: Date;
  };
};

export type CreditBalance = {
  total: number;
  breakdown: CreditBalanceBreakdown;
  isLow: boolean;
  expiringCredits?: {
    amount: number;
    expiresAt: Date;
  };
};

export type ConsumeCreditsRequest = {
  operation: CreditOperation;
  metadata?: Record<string, unknown>;
};

export type ConsumeCreditsResponse = {
  success: boolean;
  creditsUsed: number;
  remainingBalance: number;
  transactionId: string;
  isLow: boolean;
};

export type TransactionHistoryParams = {
  limit?: number;
  offset?: number;
  type?: TransactionType;
};

export type TransactionHistoryResponse = {
  transactions: CreditTransaction[];
  total: number;
  hasMore: boolean;
};

export type PurchasePackRequest = {
  packId: CreditPackId;
  provider: "paypal" | "sepay";
};

export type PurchasePackResponse = {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  qrCode?: string;
};

// ===========================================
// Plan Extension Types
// ===========================================

export type SubscriptionPlanCredits = {
  monthlyCredits: number;
  rolloverCapMultiplier: number;
};
