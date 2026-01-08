export type PlanId = "free" | "pro" | "enterprise";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceVND: number;
  priceUSD: number;
  durationDays: number;
  features: string[];
  monthlyCredits: number;
  rolloverCapMultiplier: number;
}

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceVND: 0,
    priceUSD: 0,
    durationDays: 0,
    features: ["read-only"],
    monthlyCredits: 50,
    rolloverCapMultiplier: 1,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceVND: 99_000,
    priceUSD: 9.99,
    durationDays: 30,
    features: ["full-access", "unlimited-videos", "rag-search"],
    monthlyCredits: 500,
    rolloverCapMultiplier: 2,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceVND: 299_000,
    priceUSD: 29.99,
    durationDays: 30,
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

export function getPlanPrice(planId: PlanId, currency: "VND" | "USD"): number {
  const plan = PLANS[planId];
  return currency === "VND" ? plan.priceVND : plan.priceUSD;
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
