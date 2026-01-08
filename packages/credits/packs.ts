import type { CreditPack, CreditPackId } from "./types";

/**
 * Credit pack definitions
 */
export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  small: {
    id: "small",
    name: "Small Pack",
    credits: 200,
    priceUSD: 4.99,
    priceVND: 49_000,
    validityDays: 90,
  },
  medium: {
    id: "medium",
    name: "Medium Pack",
    credits: 500,
    priceUSD: 9.99,
    priceVND: 99_000,
    validityDays: 90,
  },
  large: {
    id: "large",
    name: "Large Pack",
    credits: 1200,
    priceUSD: 19.99,
    priceVND: 199_000,
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
