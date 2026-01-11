"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Label } from "@repo/design-system/components/ui/label";
import { Switch } from "@repo/design-system/components/ui/switch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BillingPeriod } from "./pricing-data";

type BillingToggleProps = {
  readonly billingPeriod: BillingPeriod;
  readonly onBillingPeriodChange: (period: BillingPeriod) => void;
  readonly onScrollLeft?: () => void;
  readonly onScrollRight?: () => void;
  readonly showNavArrows?: boolean;
};

export function BillingToggle({
  billingPeriod,
  onBillingPeriodChange,
  onScrollLeft,
  onScrollRight,
  showNavArrows = false,
}: BillingToggleProps) {
  const isYearly = billingPeriod === "yearly";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label
          className={`text-sm ${!isYearly ? "font-medium" : "text-muted-foreground"}`}
          htmlFor="billing-toggle"
        >
          Monthly
        </Label>
        <Switch
          checked={isYearly}
          id="billing-toggle"
          onCheckedChange={(checked) =>
            onBillingPeriodChange(checked ? "yearly" : "monthly")
          }
        />
        <Label
          className={`text-sm ${isYearly ? "font-medium" : "text-muted-foreground"}`}
          htmlFor="billing-toggle"
        >
          Yearly
        </Label>
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          Save 20%
        </Badge>
      </div>

      {showNavArrows === true && (
        <div className="ml-2 flex gap-1">
          {[
            { key: "left", icon: ChevronLeft, onClick: onScrollLeft },
            { key: "right", icon: ChevronRight, onClick: onScrollRight },
          ].map(({ key, icon: Icon, onClick }) => (
            <button
              className="flex h-7 w-7 items-center justify-center rounded border transition-colors hover:bg-muted"
              key={key}
              onClick={onClick}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
