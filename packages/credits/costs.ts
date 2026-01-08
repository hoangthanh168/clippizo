import type { CreditCostConfig, CreditOperation } from "./types";

/**
 * Credit costs for each AI operation
 */
export const CREDIT_COSTS: Record<CreditOperation, CreditCostConfig> = {
  "image-gen-basic": {
    operation: "image-gen-basic",
    credits: 10,
    description: "Basic AI image generation",
  },
  "image-gen-premium": {
    operation: "image-gen-premium",
    credits: 25,
    description: "Premium AI image generation",
  },
  "video-gen-short": {
    operation: "video-gen-short",
    credits: 50,
    description: "Short video generation (<30s)",
  },
  "video-gen-long": {
    operation: "video-gen-long",
    credits: 100,
    description: "Long video generation (30s+)",
  },
  "chatbot-message": {
    operation: "chatbot-message",
    credits: 1,
    description: "AI chatbot interaction",
  },
} as const;

/**
 * Get the credit cost for an operation
 */
export function getCreditCost(operation: CreditOperation): number {
  return CREDIT_COSTS[operation].credits;
}

/**
 * Check if an operation is valid
 */
export function isValidOperation(
  operation: string
): operation is CreditOperation {
  return operation in CREDIT_COSTS;
}

/**
 * Get all available operations
 */
export function getAvailableOperations(): CreditOperation[] {
  return Object.keys(CREDIT_COSTS) as CreditOperation[];
}
