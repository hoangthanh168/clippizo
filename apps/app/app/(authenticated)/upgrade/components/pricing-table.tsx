"use client";

import { useState } from "react";
import { PlanTabsMobile } from "./plan-tabs-mobile";
import { PricingCardMobile } from "./pricing-card-mobile";
import { PLANS, type BillingPeriod, type PlanId } from "./pricing-data";
import { PricingTableDesktop } from "./pricing-table-desktop";

type PricingTableProps = {
  readonly billingPeriod: BillingPeriod;
  readonly currentPlan?: PlanId;
  readonly onSubscribe: (planId: PlanId) => void;
  readonly isRenewal?: boolean;
};

export function PricingTable({
  billingPeriod,
  currentPlan = "free",
  onSubscribe,
  isRenewal = false,
}: PricingTableProps) {
  const [selectedMobilePlan, setSelectedMobilePlan] = useState<PlanId>("pro");

  return (
    <>
      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <PricingTableDesktop
          billingPeriod={billingPeriod}
          currentPlan={currentPlan}
          isRenewal={isRenewal}
          onSubscribe={onSubscribe}
        />
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden" key={`${selectedMobilePlan}-${billingPeriod}`}>
        <PricingCardMobile
          billingPeriod={billingPeriod}
          currentPlan={currentPlan}
          isRenewal={isRenewal}
          onSubscribe={onSubscribe}
          plan={PLANS[selectedMobilePlan]}
        />
      </div>

      {/* Mobile: Sticky bottom tabs */}
      <PlanTabsMobile
        onSelectPlan={setSelectedMobilePlan}
        selectedPlan={selectedMobilePlan}
      />
    </>
  );
}
