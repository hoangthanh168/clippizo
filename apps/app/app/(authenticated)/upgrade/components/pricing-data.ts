export type PlanId = "free" | "pro" | "enterprise";
export type BillingPeriod = "monthly" | "yearly";

export type PlanPricing = {
  monthly: { priceUSD: number };
  yearly: { priceUSD: number; monthlyEquivalent: number; discount: number };
};

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  pricing: PlanPricing;
  popular?: boolean;
  features: Record<string, string | boolean>;
  credits: {
    monthly: number;
    yearly: number;
  };
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with basic features to explore the platform.",
    pricing: {
      monthly: { priceUSD: 0 },
      yearly: { priceUSD: 0, monthlyEquivalent: 0, discount: 0 },
    },
    credits: { monthly: 50, yearly: 0 },
    features: {
      "Monthly Credits": "50 credits",
      "Additional Credits": false,
      "AI Image Generation": false,
      "AI Video Generation": false,
      "RAG Search": false,
      "Export Transcripts": false,
      "Priority Support": false,
      "API Access": false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Perfect for creators who need full access to AI video tools.",
    pricing: {
      monthly: { priceUSD: 9.99 },
      yearly: { priceUSD: 95.9, monthlyEquivalent: 7.99, discount: 0.2 },
    },
    credits: { monthly: 500, yearly: 6000 },
    popular: true,
    features: {
      "Monthly Credits": "500 credits",
      "Additional Credits": "Purchase packs",
      "AI Image Generation": true,
      "AI Video Generation": true,
      "RAG Search": true,
      "Export Transcripts": true,
      "Priority Support": false,
      "API Access": false,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For teams and businesses with advanced needs and support.",
    pricing: {
      monthly: { priceUSD: 29.99 },
      yearly: { priceUSD: 287.9, monthlyEquivalent: 23.99, discount: 0.2 },
    },
    credits: { monthly: 2000, yearly: 24000 },
    features: {
      "Monthly Credits": "2000 credits",
      "Additional Credits": "Purchase packs",
      "AI Image Generation": true,
      "AI Video Generation": true,
      "RAG Search": true,
      "Export Transcripts": true,
      "Priority Support": true,
      "API Access": true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "enterprise"];

export const FEATURE_SECTIONS = [
  {
    title: "Credits",
    features: ["Monthly Credits", "Additional Credits"],
  },
  {
    title: "Core Features",
    features: [
      "AI Image Generation",
      "AI Video Generation",
      "RAG Search",
      "Export Transcripts",
    ],
  },
  {
    title: "Support & API",
    features: ["Priority Support", "API Access"],
  },
];

export const formatPrice = (price: number): string => {
  if (price === 0) {
    return "$0";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const getPlanPrice = (
  planId: PlanId,
  billingPeriod: BillingPeriod
): number => {
  const plan = PLANS[planId];
  return billingPeriod === "yearly"
    ? plan.pricing.yearly.monthlyEquivalent
    : plan.pricing.monthly.priceUSD;
};

export const getYearlyTotalPrice = (planId: PlanId): number => {
  return PLANS[planId].pricing.yearly.priceUSD;
};

export const getCreditsDisplay = (
  planId: PlanId,
  billingPeriod: BillingPeriod
): string => {
  const plan = PLANS[planId];
  if (planId === "free") return "50 credits";

  const credits =
    billingPeriod === "yearly" ? plan.credits.yearly : plan.credits.monthly;
  return `${credits.toLocaleString()} credits`;
};

export const getButtonLabel = (
  planId: PlanId,
  currentPlan: PlanId,
  isRenewal: boolean
): string => {
  if (planId === "free") {
    return currentPlan === "free" ? "Current Plan" : "Downgrade";
  }
  if (planId === currentPlan) {
    return isRenewal ? "Renew" : "Current Plan";
  }
  return "Subscribe";
};
