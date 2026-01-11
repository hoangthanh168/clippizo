export type PlanId = "free" | "pro" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  priceUSD: number;
  popular?: boolean;
  features: Record<string, string | boolean>;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with basic features to explore the platform.",
    priceUSD: 0,
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
    priceUSD: 9.99,
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
    priceUSD: 29.99,
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
