"use client";

import {
  Alert,
  AlertDescription,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Spinner } from "@repo/design-system/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { OrderSummary } from "./order-summary";
import { PaymentMethodSelector } from "./payment-method-selector";

export type PaymentProvider = "paypal" | "sepay" | "polar";
export type BillingPeriod = "monthly" | "yearly";

type CheckoutType = "subscription" | "pack";

// Fixed exchange rate: 1 USD = 26,000 VND
const USD_TO_VND_RATE = 26_000;

const SUBSCRIPTION_PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    pricing: {
      monthly: { priceUSD: 20, durationDays: 30 },
      yearly: { priceUSD: 192, durationDays: 365 },
    },
    features: {
      monthly: [
        "AI Image Generation",
        "AI Video Generation",
        "500 monthly credits",
      ],
      yearly: [
        "AI Image Generation",
        "AI Video Generation",
        "6,000 credits upfront",
        "Save 20%",
      ],
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    pricing: {
      monthly: { priceUSD: 30, durationDays: 30 },
      yearly: { priceUSD: 288, durationDays: 365 },
    },
    features: {
      monthly: [
        "Full access to all features",
        "RAG search",
        "Export transcripts",
        "Priority support",
        "API access",
        "1,500 monthly credits",
      ],
      yearly: [
        "Full access to all features",
        "RAG search",
        "Export transcripts",
        "Priority support",
        "API access",
        "18,000 credits upfront",
        "Save 20%",
      ],
    },
  },
  max: {
    id: "max",
    name: "Max",
    pricing: {
      monthly: { priceUSD: 60, durationDays: 30 },
      yearly: { priceUSD: 576, durationDays: 365 },
    },
    features: {
      monthly: [
        "Everything in Pro",
        "For power users",
        "High-volume needs",
        "5,000 monthly credits",
      ],
      yearly: [
        "Everything in Pro",
        "For power users",
        "High-volume needs",
        "60,000 credits upfront",
        "Save 20%",
      ],
    },
  },
} as const;

// Credit packs - synced with packages/credits/packs.ts (source of truth)
const CREDIT_PACKS = {
  starter: {
    id: "starter",
    name: "Starter",
    credits: 500,
    priceUSD: 9.99,
    validityDays: 90,
    features: [
      "500 credits",
      "Valid for 90 days",
      "Used before monthly credits",
    ],
  },
  small: {
    id: "small",
    name: "Basic",
    credits: 1200,
    priceUSD: 19.99,
    validityDays: 90,
    features: [
      "1,200 credits",
      "Valid for 90 days",
      "Used before monthly credits",
    ],
  },
  medium: {
    id: "medium",
    name: "Standard",
    credits: 2500,
    priceUSD: 39.99,
    validityDays: 90,
    features: [
      "2,500 credits",
      "Valid for 90 days",
      "Used before monthly credits",
    ],
  },
  large: {
    id: "large",
    name: "Pro",
    credits: 5000,
    priceUSD: 69.99,
    validityDays: 90,
    features: [
      "5,000 credits",
      "Valid for 90 days",
      "Used before monthly credits",
    ],
  },
  xlarge: {
    id: "xlarge",
    name: "Business",
    credits: 10_000,
    priceUSD: 129.99,
    validityDays: 90,
    features: [
      "10,000 credits",
      "Valid for 90 days",
      "Used before monthly credits",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    credits: 25_000,
    priceUSD: 299.99,
    validityDays: 90,
    features: [
      "25,000 credits",
      "Valid for 90 days",
      "Used before monthly credits",
    ],
  },
} as const;

type PlanId = keyof typeof SUBSCRIPTION_PLANS;
type PackId = keyof typeof CREDIT_PACKS;

function isValidPlanId(id: string): id is PlanId {
  return id in SUBSCRIPTION_PLANS;
}

function isValidPackId(id: string): id is PackId {
  return id in CREDIT_PACKS;
}

export function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") as CheckoutType | null;
  const id = searchParams.get("id");
  const isRenewal = searchParams.get("renew") === "true";
  const billingParam = searchParams.get("billing");
  const billingPeriod: BillingPeriod =
    billingParam === "yearly" ? "yearly" : "monthly";

  const [provider, setProvider] = useState<PaymentProvider>("polar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate params
  if (!(type && id)) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Invalid Checkout</CardTitle>
          <CardDescription>
            Missing checkout parameters. Please select a product first.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push("/pricing")}>View Plans</Button>
        </CardContent>
      </Card>
    );
  }

  // Get product info
  const getProduct = () => {
    if (type === "subscription") {
      if (isValidPlanId(id)) {
        const plan = SUBSCRIPTION_PLANS[id];
        const pricing = plan.pricing[billingPeriod];
        const features = plan.features[billingPeriod];
        return {
          type: "subscription" as const,
          data: {
            id: plan.id,
            name: plan.name,
            priceVND: pricing.priceUSD * USD_TO_VND_RATE,
            priceUSD: pricing.priceUSD,
            durationDays: pricing.durationDays,
            features,
          },
          billingPeriod,
        };
      }
      return null;
    }
    if (isValidPackId(id)) {
      const pack = CREDIT_PACKS[id];
      return {
        type: "pack" as const,
        data: {
          ...pack,
          priceVND: pack.priceUSD * USD_TO_VND_RATE,
        },
        billingPeriod: "monthly" as BillingPeriod,
      };
    }
    return null;
  };

  const product = getProduct();

  if (!product) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Product Not Found</CardTitle>
          <CardDescription>
            The selected product could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push("/pricing")}>View Plans</Button>
        </CardContent>
      </Card>
    );
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Payment flow requires multiple conditional paths
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint: string;
      let body: Record<string, unknown>;

      if (type === "subscription") {
        if (provider === "paypal") {
          endpoint = "/api/checkout/paypal";
        } else if (provider === "polar") {
          endpoint = "/api/checkout/polar";
        } else {
          endpoint = "/api/checkout/sepay";
        }
        body = { plan: id, billingPeriod, isRenewal };
      } else {
        endpoint = "/api/credits/packs/purchase";
        body = { packId: id, provider };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate checkout");
      }

      // Handle SePay - create and submit form via POST
      if (provider === "sepay" && data.formFields && data.checkoutUrl) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.checkoutUrl;

        for (const [key, value] of Object.entries(data.formFields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Handle PayPal/Polar - redirect to checkout URL
      const redirectUrl =
        data.approvalUrl || data.checkoutUrl || data.paymentUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const price =
    provider === "sepay" ? product.data.priceVND : product.data.priceUSD;
  const currency = provider === "sepay" ? "VND" : "USD";

  const formatPrice = (amount: number, curr: string) =>
    new Intl.NumberFormat(curr === "VND" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: curr,
    }).format(amount);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-2 font-bold text-3xl">Checkout</h1>
        <p className="text-muted-foreground">
          {isRenewal ? "Renew your subscription" : "Complete your purchase"}
        </p>
      </div>

      <OrderSummary
        isRenewal={isRenewal}
        product={product}
        provider={provider}
      />

      <PaymentMethodSelector onChange={setProvider} value={provider} />

      {error !== null && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full py-6 text-lg"
        disabled={loading}
        onClick={handleCheckout}
        size="lg"
      >
        {loading ? (
          <>
            <Spinner className="mr-2" />
            Processing...
          </>
        ) : (
          `Complete Purchase (${formatPrice(price, currency)})`
        )}
      </Button>

      <p className="text-center text-muted-foreground text-xs">
        By completing this purchase, you agree to our Terms of Service and
        Privacy Policy.
      </p>
    </div>
  );
}
