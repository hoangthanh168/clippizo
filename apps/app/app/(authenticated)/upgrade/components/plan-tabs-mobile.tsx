"use client";

import { cn } from "@repo/design-system/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PLAN_ORDER, PLANS, type PlanId } from "./pricing-data";

type PlanTabsMobileProps = {
  readonly selectedPlan: PlanId;
  readonly onSelectPlan: (planId: PlanId) => void;
};

export function PlanTabsMobile({
  selectedPlan,
  onSelectPlan,
}: PlanTabsMobileProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      newIndex = index === 0 ? PLAN_ORDER.length - 1 : index - 1;
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      newIndex = index === PLAN_ORDER.length - 1 ? 0 : index + 1;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectPlan(PLAN_ORDER[index]);
      return;
    } else {
      return;
    }

    onSelectPlan(PLAN_ORDER[newIndex]);
    const nextButton = document.getElementById(
      `plan-tab-${PLAN_ORDER[newIndex]}`
    );
    nextButton?.focus();
  };

  const tabs = (
    <nav
      aria-label="Select pricing plan"
      className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      role="tablist"
    >
      {PLAN_ORDER.map((planId, index) => {
        const plan = PLANS[planId];
        const isSelected = selectedPlan === planId;

        return (
          <button
            aria-controls={`plan-panel-${planId}`}
            aria-selected={isSelected}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            id={`plan-tab-${planId}`}
            key={planId}
            onClick={() => onSelectPlan(planId)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="tab"
            tabIndex={isSelected ? 0 : -1}
            type="button"
          >
            <span>{plan.name}</span>
            {plan.popular && (
              <span className="text-[10px] text-primary">Popular</span>
            )}
            {/* Active indicator line */}
            {isSelected && (
              <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(tabs, document.body);
}
