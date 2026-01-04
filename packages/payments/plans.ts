export type PlanId = "free" | "pro" | "enterprise";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceVND: number;
  priceUSD: number;
  durationDays: number;
  features: string[];
}

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    priceVND: 0,
    priceUSD: 0,
    durationDays: 0,
    features: ["read-only"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceVND: 99000,
    priceUSD: 9.99,
    durationDays: 30,
    features: ["full-access", "unlimited-videos", "rag-search"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceVND: 299000,
    priceUSD: 29.99,
    durationDays: 30,
    features: [
      "full-access",
      "unlimited-videos",
      "rag-search",
      "priority-support",
      "api-access",
    ],
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
