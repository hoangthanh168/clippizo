import { Button } from "@repo/design-system/components/ui/button";
import { Check, Minus, MoveRight } from "lucide-react";
import Link from "next/link";
import { env } from "@/env";

const PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with basic features to explore the platform.",
    priceUSD: 0,
    priceVND: 0,
    features: {
      "Monthly Credits": "50 credits",
      "AI Image Generation": false,
      "AI Video Generation": false,
      "RAG Search": false,
      "Export Transcripts": false,
      "Priority Support": false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Perfect for creators who need full access to AI video tools.",
    priceUSD: 9.99,
    priceVND: 99_000,
    popular: true,
    features: {
      "Monthly Credits": "500 credits",
      "AI Image Generation": true,
      "AI Video Generation": true,
      "RAG Search": true,
      "Export Transcripts": true,
      "Priority Support": false,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For teams and businesses with advanced needs and support.",
    priceUSD: 29.99,
    priceVND: 299_000,
    features: {
      "Monthly Credits": "2000 credits",
      "AI Image Generation": true,
      "AI Video Generation": true,
      "RAG Search": true,
      "Export Transcripts": true,
      "Priority Support": true,
    },
  },
} as const;

const featureKeys = [
  "Monthly Credits",
  "AI Image Generation",
  "AI Video Generation",
  "RAG Search",
  "Export Transcripts",
  "Priority Support",
] as const;

type PlanId = keyof typeof PLANS;

const formatPrice = (price: number, currency: "USD" | "VND") => {
  if (price === 0) {
    return "$0";
  }
  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    style: "currency",
    currency,
  }).format(price);
};

const getCheckoutUrl = (planId: PlanId) => {
  if (planId === "free") {
    return env.NEXT_PUBLIC_APP_URL;
  }
  return `${env.NEXT_PUBLIC_APP_URL}/upgrade?plan=${planId}`;
};

const Pricing = () => (
  <div className="w-full py-20 lg:py-40">
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="max-w-xl text-center font-regular text-3xl tracking-tighter md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="max-w-xl text-center text-lg text-muted-foreground leading-relaxed tracking-tight">
            Choose the plan that fits your creative needs. All paid plans
            include a 30-day subscription.
          </p>
        </div>
        <div className="grid w-full grid-cols-3 divide-x pt-20 text-left lg:grid-cols-4">
          <div className="col-span-3 lg:col-span-1" />
          {Object.values(PLANS).map((plan) => (
            <div
              className="flex flex-col gap-2 px-3 py-1 md:px-6 md:py-4"
              key={plan.id}
            >
              <div className="flex items-center gap-2">
                <p className="text-2xl">{plan.name}</p>
                {"popular" in plan && plan.popular && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {plan.description}
              </p>
              <p className="mt-8 flex flex-col gap-2 text-xl lg:flex-row lg:items-center">
                <span className="text-4xl">
                  {formatPrice(plan.priceUSD, "USD")}
                </span>
                {plan.priceUSD > 0 && (
                  <span className="text-muted-foreground text-sm">/ month</span>
                )}
              </p>
              {plan.priceVND > 0 && (
                <p className="text-muted-foreground text-sm">
                  ~{formatPrice(plan.priceVND, "VND")}
                </p>
              )}
              <Button
                asChild
                className="mt-8 gap-4"
                variant={plan.id === "pro" ? "default" : "outline"}
              >
                <Link href={getCheckoutUrl(plan.id as PlanId)}>
                  {plan.id === "free" ? "Get Started" : "Subscribe"}
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
          <div className="col-span-3 px-3 py-4 lg:col-span-1 lg:px-6">
            <b>Features</b>
          </div>
          <div />
          <div />
          <div />
          {featureKeys.map((feature) => (
            <FeatureRow feature={feature} key={feature} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const FeatureRow = ({ feature }: { readonly feature: string }) => (
  <>
    <div className="col-span-3 px-3 py-4 lg:col-span-1 lg:px-6">{feature}</div>
    {Object.values(PLANS).map((plan) => {
      const value = plan.features[feature as keyof typeof plan.features];
      return (
        <div
          className="flex justify-center px-3 py-1 md:px-6 md:py-4"
          key={`${plan.id}-${feature}`}
        >
          {typeof value === "string" ? (
            <p className="text-muted-foreground text-sm">{value}</p>
          ) : value ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      );
    })}
  </>
);

export default Pricing;
