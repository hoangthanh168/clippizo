export type PlanId = "free" | "pro" | "enterprise";
export type BillingPeriod = "monthly" | "yearly";

export interface PeriodPricing {
  priceVND: number;
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
      monthly: { priceVND: 0, priceUSD: 0, durationDays: 0 },
      yearly: {
        priceVND: 0,
        priceUSD: 0,
        durationDays: 0,
        discount: 0,
        creditsUpfront: 0,
      },
    },
    features: ["read-only"],
    monthlyCredits: 50,
    rolloverCapMultiplier: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricing: {
      monthly: { priceVND: 99_000, priceUSD: 9.99, durationDays: 30 },
      yearly: {
        priceVND: 950_400,
        priceUSD: 95.9,
        durationDays: 365,
        discount: 0.2,
        creditsUpfront: 6000,
      },
    },
    features: ["full-access", "unlimited-videos", "rag-search"],
    monthlyCredits: 500,
    rolloverCapMultiplier: 2,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    pricing: {
      monthly: { priceVND: 299_000, priceUSD: 29.99, durationDays: 30 },
      yearly: {
        priceVND: 2_871_360,
        priceUSD: 287.9,
        durationDays: 365,
        discount: 0.2,
        creditsUpfront: 24000,
      },
    },
    features: [
      "full-access",
      "unlimited-videos",
      "rag-search",
      "priority-support",
      "api-access",
    ],
    monthlyCredits: 2000,
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
  const pricing = plan.pricing[billingPeriod];
  return currency === "VND" ? pricing.priceVND : pricing.priceUSD;
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

export function isPaidPlan(planId: string): planId is "pro" | "enterprise" {
  return planId === "pro" || planId === "enterprise";
}

export function getPlanCredits(planId: PlanId): number {
  return PLANS[planId].monthlyCredits;
}

export function getPlanRolloverCap(planId: PlanId): number {
  const plan = PLANS[planId];
  return plan.monthlyCredits * plan.rolloverCapMultiplier;
}
