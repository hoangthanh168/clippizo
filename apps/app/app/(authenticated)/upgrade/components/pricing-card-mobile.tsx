"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Check, Minus, Star } from "lucide-react";
import {
  FEATURE_SECTIONS,
  formatPrice,
  getButtonLabel,
  type Plan,
  type PlanId,
} from "./pricing-data";

type FeatureValueProps = {
  readonly value: string | boolean;
};

function FeatureValue({ value }: FeatureValueProps) {
  if (typeof value === "string") {
    return <span className="text-sm">{value}</span>;
  }
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500" />;
  }
  return <Minus className="h-5 w-5 text-muted-foreground" />;
}

type PricingCardMobileProps = {
  readonly plan: Plan;
  readonly currentPlan: PlanId;
  readonly onSubscribe: (planId: PlanId) => void;
  readonly isRenewal: boolean;
};

export function PricingCardMobile({
  plan,
  currentPlan,
  onSubscribe,
  isRenewal,
}: PricingCardMobileProps) {
  return (
    <div
      aria-labelledby={`plan-tab-${plan.id}`}
      className="fade-in animate-in rounded-xl border bg-card duration-200"
      id={`plan-panel-${plan.id}`}
      role="tabpanel"
    >
      {/* Header section */}
      <div className="space-y-4 border-b p-6 text-center">
        {/* Badge */}
        {plan.popular && (
          <Badge className="gap-1" variant="default">
            <Star className="h-3 w-3" />
            Most Popular
          </Badge>
        )}

        {/* Plan name */}
        <h2 className="font-semibold text-xl">{plan.name}</h2>

        {/* Price */}
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-bold text-4xl">
            {formatPrice(plan.priceUSD)}
          </span>
          {plan.priceUSD > 0 && (
            <span className="text-muted-foreground">/month</span>
          )}
        </div>

        {/* Description */}
        <p className="mx-auto max-w-xs text-muted-foreground text-sm">
          {plan.description}
        </p>

        {/* Subscribe button */}
        <Button
          className="w-full"
          disabled={plan.id === "free" && currentPlan === "free"}
          onClick={() => onSubscribe(plan.id)}
          variant={plan.popular ? "default" : "outline"}
        >
          {getButtonLabel(plan.id, currentPlan, isRenewal)}
        </Button>
      </div>

      {/* Features section */}
      <div className="p-6">
        {FEATURE_SECTIONS.map((section) => (
          <div className="mb-6 last:mb-0" key={section.title}>
            <h3 className="mb-3 font-semibold text-sm">{section.title}</h3>
            <ul className="space-y-3">
              {section.features.map((feature) => (
                <li
                  className="flex items-center justify-between text-sm"
                  key={feature}
                >
                  <span className="text-muted-foreground">{feature}</span>
                  <FeatureValue value={plan.features[feature]} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
