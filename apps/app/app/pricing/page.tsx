"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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

function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRenewal = searchParams.get("renew") === "true";
  const upgradeTarget = searchParams.get("upgrade");

  const [loading, setLoading] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"VND" | "USD">("VND");

  const handleSePayCheckout = async (planId: PlanId) => {
    if (planId === "free") return;

    setLoading(`sepay-${planId}`);
    try {
      const response = await fetch("/api/checkout/sepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, isRenewal }),
      });

      const data = await response.json();

      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.message || "Failed to create checkout");
      }
    } catch (error) {
      console.error("SePay checkout error:", error);
      alert("Failed to initiate checkout");
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalCheckout = async (planId: PlanId) => {
    if (planId === "free") return;

    setLoading(`paypal-${planId}`);
    try {
      const response = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, isRenewal }),
      });

      const data = await response.json();

      if (data.ok && data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert(data.message || "Failed to create order");
      }
    } catch (error) {
      console.error("PayPal checkout error:", error);
      alert("Failed to initiate checkout");
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (plan: (typeof PLANS)[PlanId]) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(plan.priceVND);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(plan.priceUSD);
  };

  const filteredPlans = upgradeTarget
    ? Object.values(PLANS).filter((p) => p.id === upgradeTarget)
    : Object.values(PLANS);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-bold text-4xl">
          {isRenewal ? "Renew Your Subscription" : "Choose Your Plan"}
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          {isRenewal
            ? "Extend your subscription to continue enjoying full access to all features."
            : "Select the plan that best fits your needs. All paid plans include a 30-day subscription period."}
        </p>

        {/* Currency toggle */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            className={`rounded-md px-4 py-2 text-sm ${
              currency === "VND"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
            onClick={() => setCurrency("VND")}
            type="button"
          >
            VND (SePay)
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm ${
              currency === "USD"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
            onClick={() => setCurrency("USD")}
            type="button"
          >
            USD (PayPal)
          </button>
        </div>
      </div>

      <div
        className={`grid gap-8 ${filteredPlans.length === 1 ? "mx-auto max-w-md" : filteredPlans.length === 2 ? "mx-auto max-w-3xl md:grid-cols-2" : "md:grid-cols-3"}`}
      >
        {filteredPlans.map((plan) => (
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
              <span className="font-bold text-4xl">{formatPrice(plan)}</span>
              {plan.id !== "free" && (
                <span className="text-muted-foreground">/month</span>
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
              <button
                className="rounded-md border py-3 text-center"
                onClick={() => router.push("/")}
                type="button"
              >
                Current Plan
              </button>
            ) : (
              <div className="space-y-2">
                {currency === "VND" ? (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-primary-foreground disabled:opacity-50"
                    disabled={loading !== null}
                    onClick={() => handleSePayCheckout(plan.id)}
                    type="button"
                  >
                    {loading === `sepay-${plan.id}` ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Pay with SePay"
                    )}
                  </button>
                ) : (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0070ba] py-3 text-white disabled:opacity-50"
                    disabled={loading !== null}
                    onClick={() => handlePayPalCheckout(plan.id)}
                    type="button"
                  >
                    {loading === `paypal-${plan.id}` ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Pay with PayPal"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
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

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
