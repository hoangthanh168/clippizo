export type PlanId = "free" | "starter" | "pro" | "max";
export type BillingPeriod = "monthly" | "yearly";

// Fixed exchange rate: 1 USD = 26,000 VND
export const USD_TO_VND_RATE = 26_000;

export interface PeriodPricing {
  priceUSD: number;
  durationDays: number;
}

export interface YearlyPricing extends PeriodPricing {
  discount: number;
  creditsUpfront: number;
}

export interface PlanPricing {
  monthly: PeriodPricing;
  yearly: YearlyPricing;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  pricing: PlanPricing;
  features: string[];
  monthlyCredits: number;
  rolloverCapMultiplier: number;
}

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    pricing: {
      monthly: { priceUSD: 0, durationDays: 0 },
      yearly: {
        priceUSD: 0,
        durationDays: 0,
        discount: 0,
        creditsUpfront: 0,
      },
    },
    features: ["read-only"],
    monthlyCredits: 100,
    rolloverCapMultiplier: 1,
  },
  starter: {
    id: "starter",
    name: "Starter",
    pricing: {
      monthly: { priceUSD: 20, durationDays: 30 },
      yearly: {
        priceUSD: 192,
        durationDays: 365,
        discount: 0.2,
        creditsUpfront: 6000,
      },
    },
    features: ["ai-image-generation", "ai-video-generation"],
    monthlyCredits: 500,
    rolloverCapMultiplier: 2,
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricing: {
      monthly: { priceUSD: 30, durationDays: 30 },
      yearly: {
        priceUSD: 288,
        durationDays: 365,
        discount: 0.2,
        creditsUpfront: 18000,
      },
    },
    features: [
      "ai-image-generation",
      "ai-video-generation",
      "rag-search",
      "export-transcripts",
      "priority-support",
      "api-access",
    ],
    monthlyCredits: 1500,
    rolloverCapMultiplier: 2,
  },
  max: {
    id: "max",
    name: "Max",
    pricing: {
      monthly: { priceUSD: 60, durationDays: 30 },
      yearly: {
        priceUSD: 576,
        durationDays: 365,
        discount: 0.2,
        creditsUpfront: 60000,
      },
    },
    features: [
      "ai-image-generation",
      "ai-video-generation",
      "rag-search",
      "export-transcripts",
      "priority-support",
      "api-access",
    ],
    monthlyCredits: 5000,
    rolloverCapMultiplier: 2,
  },
} as const;

export function getPlan(planId: string): SubscriptionPlan | undefined {
  return PLANS[planId as PlanId];
}

export function getPlanPrice(
  planId: PlanId,
  currency: "VND" | "USD",
  billingPeriod: BillingPeriod = "monthly"
): number {
  const plan = PLANS[planId];
  const priceUSD = plan.pricing[billingPeriod].priceUSD;
  return currency === "VND" ? priceUSD * USD_TO_VND_RATE : priceUSD;
}

export function getPlanDuration(
  planId: PlanId,
  billingPeriod: BillingPeriod = "monthly"
): number {
  return PLANS[planId].pricing[billingPeriod].durationDays;
}

export function getYearlyCredits(planId: PlanId): number {
  return PLANS[planId].pricing.yearly.creditsUpfront;
}

export function isPaidPlan(planId: string): planId is "starter" | "pro" | "max" {
  return planId === "starter" || planId === "pro" || planId === "max";
}

export function getPlanCredits(planId: PlanId): number {
  return PLANS[planId].monthlyCredits;
}

export function getPlanRolloverCap(planId: PlanId): number {
  const plan = PLANS[planId];
  return plan.monthlyCredits * plan.rolloverCapMultiplier;
}
