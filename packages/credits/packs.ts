import type { CreditPack, CreditPackId } from "./types";

/**
 * Credit pack definitions
 */
export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  starter: {
    id: "starter",
    name: "Starter",
    credits: 500,
    priceUSD: 9.99,
    priceVND: 249_000,
    validityDays: 90,
  },
  small: {
    id: "small",
    name: "Basic",
    credits: 1200,
    priceUSD: 19.99,
    priceVND: 499_000,
    validityDays: 90,
  },
  medium: {
    id: "medium",
    name: "Standard",
    credits: 2500,
    priceUSD: 39.99,
    priceVND: 999_000,
    validityDays: 90,
  },
  large: {
    id: "large",
    name: "Pro",
    credits: 5000,
    priceUSD: 69.99,
    priceVND: 1_749_000,
    validityDays: 90,
  },
  xlarge: {
    id: "xlarge",
    name: "Business",
    credits: 10000,
    priceUSD: 129.99,
    priceVND: 3_249_000,
    validityDays: 90,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    credits: 25000,
    priceUSD: 299.99,
    priceVND: 7_499_000,
    validityDays: 90,
  },
} as const;

/**
 * Get a credit pack by ID
 */
export function getCreditPack(packId: CreditPackId): CreditPack {
  return CREDIT_PACKS[packId];
}

/**
 * Check if a pack ID is valid
 */
export function isValidPackId(packId: string): packId is CreditPackId {
  return packId in CREDIT_PACKS;
}

/**
 * Get all available credit packs
 */
export function getAvailablePacks(): CreditPack[] {
  return Object.values(CREDIT_PACKS);
}

/**
 * Get pack price by ID and currency
 */
export function getPackPrice(
  packId: CreditPackId,
  currency: "USD" | "VND"
): number {
  const pack = CREDIT_PACKS[packId];
  return currency === "USD" ? pack.priceUSD : pack.priceVND;
}
