"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceVND: 0,
    priceUSD: 0,
    features: ["Read-only access", "View transcripts", "Basic search"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceVND: 99_000,
    priceUSD: 9.99,
    features: [
      "Full access",
      "Unlimited videos",
      "RAG search",
      "Export transcripts",
      "30-day subscription",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceVND: 299_000,
    priceUSD: 29.99,
    features: [
      "Everything in Pro",
      "Priority support",
      "API access",
      "Custom integrations",
      "30-day subscription",
    ],
  },
} as const;

type PlanId = keyof typeof PLANS;

export function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRenewal = searchParams.get("renew") === "true";
  const upgradeTarget = searchParams.get("upgrade");

  const formatPrice = (plan: (typeof PLANS)[PlanId]) => {
    const vnd = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(plan.priceVND);
    const usd = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(plan.priceUSD);
    return { vnd, usd };
  };

  const filteredPlans = upgradeTarget
    ? Object.values(PLANS).filter((p) => p.id === upgradeTarget)
    : Object.values(PLANS);

  const getGridClassName = () => {
    if (filteredPlans.length === 1) {
      return "mx-auto max-w-md";
    }
    if (filteredPlans.length === 2) {
      return "mx-auto max-w-3xl md:grid-cols-2";
    }
    return "md:grid-cols-3";
  };

  const handleGetStarted = (planId: PlanId) => {
    const params = new URLSearchParams({
      type: "subscription",
      id: planId,
    });
    if (isRenewal) {
      params.set("renew", "true");
    }
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-bold text-4xl">
          {isRenewal ? "Renew Your Subscription" : "Choose Your Plan"}
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          {isRenewal
            ? "Extend your subscription to continue enjoying full access to all features."
            : "Select the plan that best fits your needs. All paid plans include a 30-day subscription period."}
        </p>
      </div>

      <div className={`grid gap-8 ${getGridClassName()}`}>
        {filteredPlans.map((plan) => {
          const prices = formatPrice(plan);
          return (
            <div
              className={`flex flex-col rounded-xl border p-6 ${
                plan.id === "pro" ? "border-primary shadow-lg" : ""
              }`}
              key={plan.id}
            >
              {plan.id === "pro" && (
                <span className="mb-4 self-start rounded-full bg-primary px-3 py-1 text-primary-foreground text-xs">
                  Most Popular
                </span>
              )}

              <h2 className="mb-2 font-bold text-2xl">{plan.name}</h2>

              <div className="mb-6">
                {plan.id === "free" ? (
                  <span className="font-bold text-4xl">{prices.usd}</span>
                ) : (
                  <>
                    <span className="font-bold text-4xl">{prices.usd}</span>
                    <span className="text-muted-foreground">/month</span>
                    <p className="mt-1 text-muted-foreground text-sm">
                      ~{prices.vnd}
                    </p>
                  </>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-2" key={feature}>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <Button
                  className="w-full"
                  onClick={() => router.push("/")}
                  variant="outline"
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleGetStarted(plan.id)}
                >
                  {isRenewal ? "Renew Now" : "Get Started"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-muted-foreground text-sm">
        <p>
          Subscriptions are one-time payments valid for 30 days. Renew manually
          before expiry to maintain access.
        </p>
        <p className="mt-2">
          Need help?{" "}
          <a className="text-primary" href="mailto:support@clippizo.com">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
