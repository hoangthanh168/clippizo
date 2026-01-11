"use client";

import type { CreditBalance } from "@repo/credits";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BillingToggle } from "./components/billing-toggle";
import { CreditStatus } from "./components/credit-status";
import { FAQSection } from "./components/faq-section";
import { PricingTable } from "./components/pricing-table";

type PlanId = "free" | "pro" | "enterprise";

type SubscriptionInfo = {
  plan: PlanId;
  status: string | null;
  expiresAt: string | null;
  isActive: boolean;
  daysRemaining: number | null;
};

export function UpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRenewal = searchParams.get("renew") === "true";

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, creditsRes] = await Promise.all([
          fetch("/api/subscription"),
          fetch("/api/credits/balance"),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.subscription);
        }

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCredits(creditsData.balance);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSubscribe = (planId: PlanId) => {
    if (planId === "free") {
      router.push("/");
      return;
    }

    const params = new URLSearchParams({
      type: "subscription",
      id: planId,
    });
    if (isRenewal) {
      params.set("renew", "true");
    }
    router.push(`/checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CreditStatus credits={credits} subscription={subscription} />
        <BillingToggle />
      </div>

      <PricingTable
        currentPlan={subscription?.plan ?? "free"}
        isRenewal={isRenewal}
        onSubscribe={handleSubscribe}
      />

      <FAQSection />
    </div>
  );
}
