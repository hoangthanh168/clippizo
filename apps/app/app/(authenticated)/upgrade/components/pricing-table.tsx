"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Check, Minus, Star } from "lucide-react";

type PlanId = "free" | "pro" | "enterprise";

type Plan = {
  id: PlanId;
  name: string;
  description: string;
  priceUSD: number;
  popular?: boolean;
  features: Record<string, string | boolean>;
};

const PLANS: Record<PlanId, Plan> = {
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

const FEATURE_SECTIONS = [
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

const formatPrice = (price: number) => {
  if (price === 0) {
    return "$0";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const getButtonLabel = (
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

type FeatureValueProps = {
  readonly value: string | boolean;
};

function FeatureValue({ value }: FeatureValueProps) {
  if (typeof value === "string") {
    return <span className="text-sm">{value}</span>;
  }
  if (value === true) {
    return <Check className="mx-auto h-5 w-5 text-green-500" />;
  }
  return <Minus className="mx-auto h-5 w-5 text-muted-foreground" />;
}

type PricingTableProps = {
  readonly currentPlan?: PlanId;
  readonly onSubscribe: (planId: PlanId) => void;
  readonly isRenewal?: boolean;
};

export function PricingTable({
  currentPlan = "free",
  onSubscribe,
  isRenewal = false,
}: PricingTableProps) {
  const plans = Object.values(PLANS);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="sticky top-0 z-10 border-b bg-card">
            {/* Row 1: Badge */}
            <tr>
              <th className="w-[200px] p-4" />
              {plans.map((plan) => (
                <th
                  className="border-l px-4 pt-4 text-center"
                  key={`badge-${plan.id}`}
                >
                  <Badge
                    className={`gap-1 ${plan.popular ? "" : "invisible"}`}
                    variant="default"
                  >
                    <Star className="h-3 w-3" />
                    Most Popular
                  </Badge>
                </th>
              ))}
            </tr>

            {/* Row 2: Plan name */}
            <tr>
              <th />
              {plans.map((plan) => (
                <th
                  className="border-l px-4 py-2 text-center"
                  key={`name-${plan.id}`}
                >
                  <span className="font-semibold text-lg">{plan.name}</span>
                </th>
              ))}
            </tr>

            {/* Row 3: Price */}
            <tr>
              <th />
              {plans.map((plan) => (
                <th
                  className="border-l px-4 py-2 text-center"
                  key={`price-${plan.id}`}
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-bold text-3xl">
                      {formatPrice(plan.priceUSD)}
                    </span>
                    {plan.priceUSD > 0 && (
                      <span className="text-muted-foreground text-sm">
                        /month
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {/* Row 4: Description */}
            <tr>
              <th />
              {plans.map((plan) => (
                <th
                  className="border-l px-4 py-2 text-center font-normal"
                  key={`desc-${plan.id}`}
                >
                  <p className="mx-auto max-w-[180px] text-muted-foreground text-xs leading-relaxed">
                    {plan.description}
                  </p>
                </th>
              ))}
            </tr>

            {/* Row 5: Button */}
            <tr>
              <th />
              {plans.map((plan) => (
                <th
                  className="border-l px-4 pb-4 pt-2 text-center font-normal"
                  key={`btn-${plan.id}`}
                >
                  <Button
                    className="w-full max-w-[140px]"
                    disabled={plan.id === "free" && currentPlan === "free"}
                    onClick={() => onSubscribe(plan.id)}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {getButtonLabel(plan.id, currentPlan, isRenewal)}
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_SECTIONS.map((section) => (
              <>
                <tr className="bg-muted/50" key={section.title}>
                  <td
                    className="px-4 py-3 font-semibold text-sm"
                    colSpan={plans.length + 1}
                  >
                    {section.title}
                  </td>
                </tr>
                {section.features.map((feature) => (
                  <tr className="border-t" key={feature}>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {feature}
                    </td>
                    {plans.map((plan) => (
                      <td
                        className="border-l px-4 py-3 text-center"
                        key={`${plan.id}-${feature}`}
                      >
                        <FeatureValue value={plan.features[feature]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
