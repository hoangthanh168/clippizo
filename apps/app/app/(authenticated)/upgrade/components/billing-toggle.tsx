"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
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
          className={`text-sm ${isYearly ? "text-muted-foreground" : "font-medium"}`}
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
        <Badge className="bg-success text-white">Save 20%</Badge>
      </div>

      {showNavArrows === true && (
        <div className="ml-2 flex gap-1">
          <Button onClick={onScrollLeft} size="icon-sm" variant="ghost">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={onScrollRight} size="icon-sm" variant="ghost">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
