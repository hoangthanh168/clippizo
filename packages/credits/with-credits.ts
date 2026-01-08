import "server-only";
import { canAffordOperation, consumeCredits } from "./consumption";
import { InsufficientCreditsError } from "./errors";
import type { ConsumeCreditsResponse, CreditOperation } from "./types";

/**
 * Result of an operation wrapped with credit consumption
 */
export interface WithCreditsResult<T> {
  result: T;
  credits: ConsumeCreditsResponse;
}

/**
 * Wrap an async operation with credit consumption
 * Credits are deducted BEFORE the operation runs (pre-pay model)
 *
 * @example
 * ```typescript
 * // In an AI endpoint handler
 * const { result, credits } = await withCredits(
 *   profileId,
 *   "image-gen-basic",
 *   async () => {
 *     // Call AI service here
 *     return await generateImage(prompt);
 *   },
 *   { prompt, model: "dall-e-3" }
 * );
 * ```
 */
export async function withCredits<T>(
  profileId: string,
  operation: CreditOperation,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<WithCreditsResult<T>> {
  // Pre-pay: Consume credits before the operation
  const credits = await consumeCredits(profileId, operation, metadata);

  // Execute the actual operation
  const result = await fn();

  return { result, credits };
}

/**
 * Wrap an async operation with credit consumption (post-pay model)
 * Credits are deducted AFTER the operation succeeds
 *
 * Use this when you want to refund credits if the operation fails.
 * Note: If the operation succeeds but credit consumption fails,
 * the operation result is still returned.
 *
 * @example
 * ```typescript
 * const { result, credits } = await withCreditsPostPay(
 *   profileId,
 *   "video-gen-short",
 *   async () => {
 *     return await generateVideo(params);
 *   }
 * );
 * ```
 */
export async function withCreditsPostPay<T>(
  profileId: string,
  operation: CreditOperation,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<WithCreditsResult<T>> {
  // Validate credits first (without consuming)
  const { canAfford, available, required } = await canAffordOperation(
    profileId,
    operation
  );

  if (!canAfford) {
    throw new InsufficientCreditsError(required, available);
  }

  // Execute the actual operation
  const result = await fn();

  // Post-pay: Consume credits after successful operation
  const credits = await consumeCredits(profileId, operation, metadata);

  return { result, credits };
}

/**
 * Check and reserve credits for an operation
 * Returns a function to consume the reserved credits
 *
 * This is useful for multi-step operations where you want to
 * verify credits upfront but consume them later.
 *
 * @example
 * ```typescript
 * const consume = await reserveCredits(profileId, "image-gen-premium");
 *
 * // Do some validation or preparation...
 * const imagePrompt = await preparePrompt(userInput);
 *
 * // Now consume the credits and run the operation
 * const result = await consume(async () => generateImage(imagePrompt));
 * ```
 */
export async function reserveCredits(
  profileId: string,
  operation: CreditOperation
): Promise<
  <T>(
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ) => Promise<WithCreditsResult<T>>
> {
  // Validate credits upfront
  const { canAfford, available, required } = await canAffordOperation(
    profileId,
    operation
  );

  if (!canAfford) {
    throw new InsufficientCreditsError(required, available);
  }

  // Return a function that consumes credits when called
  return async <T>(fn: () => Promise<T>, metadata?: Record<string, unknown>) =>
    withCredits(profileId, operation, fn, metadata);
}

/**
 * Integration helper for AI endpoint handlers
 * Combines common patterns: auth check, profile lookup, and credit consumption
 *
 * @example
 * ```typescript
 * // In an API route handler
 * export async function POST(request: Request) {
 *   return handleAIOperationWithCredits(request, "image-gen-basic", async (profile) => {
 *     const { prompt } = await request.json();
 *     return await generateImage(prompt);
 *   });
 * }
 * ```
 */
export type AIOperationHandler<T> = (profile: {
  id: string;
  clerkUserId: string;
}) => Promise<T>;

// Note: The actual integration with auth and request handling should be done
// in the apps/app layer since it depends on the auth package and Next.js specifics.
// This file provides the core utilities for credit consumption wrapping.
