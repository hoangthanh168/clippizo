import { z } from "zod";

/**
 * Zod schemas for runtime validation
 */

export const creditOperationSchema = z.enum([
  "image-gen-basic",
  "image-gen-premium",
  "video-gen-short",
  "video-gen-long",
  "chatbot-message",
]);

export const creditPackIdSchema = z.enum([
  "starter",
  "small",
  "medium",
  "large",
  "xlarge",
  "enterprise",
]);

export const paymentProviderSchema = z.enum(["paypal", "sepay", "polar"]);

export const transactionTypeSchema = z.enum([
  "allocation",
  "pack_purchase",
  "consumption",
  "expiration",
  "adjustment",
]);

export const consumeCreditsSchema = z.object({
  operation: creditOperationSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const purchasePackSchema = z.object({
  packId: creditPackIdSchema,
  provider: paymentProviderSchema,
});

export const transactionHistorySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  type: transactionTypeSchema.optional(),
});

export type ConsumeCreditsInput = z.infer<typeof consumeCreditsSchema>;
export type PurchasePackInput = z.infer<typeof purchasePackSchema>;
export type TransactionHistoryInput = z.infer<typeof transactionHistorySchema>;
