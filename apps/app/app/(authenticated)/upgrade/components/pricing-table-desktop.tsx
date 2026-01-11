"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Check, Minus, Star } from "lucide-react";
import { Fragment } from "react";
import {
  FEATURE_SECTIONS,
  formatPrice,
  getButtonLabel,
  PLAN_ORDER,
  PLANS,
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

type PricingTableDesktopProps = {
  readonly currentPlan: PlanId;
  readonly onSubscribe: (planId: PlanId) => void;
  readonly isRenewal: boolean;
};

export function PricingTableDesktop({
  currentPlan,
  onSubscribe,
  isRenewal,
}: PricingTableDesktopProps) {
  const plans: Plan[] = PLAN_ORDER.map((id) => PLANS[id]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="sticky top-0 z-10 border-b bg-card">
            {/* Row 1: Badge */}
            <tr>
              <th className="sticky left-0 z-20 w-[200px] bg-card p-4" />
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
              <th className="sticky left-0 z-20 bg-card" />
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
              <th className="sticky left-0 z-20 bg-card" />
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
              <th className="sticky left-0 z-20 bg-card" />
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
              <th className="sticky left-0 z-20 bg-card" />
              {plans.map((plan) => (
                <th
                  className="border-l px-4 pt-2 pb-4 text-center font-normal"
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
              <Fragment key={section.title}>
                <tr className="bg-muted/50">
                  <td className="sticky left-0 z-10 bg-muted/50 px-4 py-3 font-semibold text-sm">
                    {section.title}
                  </td>
                  {plans.map((plan) => (
                    <td
                      className="border-l"
                      key={`section-${section.title}-${plan.id}`}
                    />
                  ))}
                </tr>
                {section.features.map((feature) => (
                  <tr className="border-t" key={feature}>
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 text-muted-foreground text-sm">
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
