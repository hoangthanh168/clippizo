"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Label } from "@repo/design-system/components/ui/label";
import { Switch } from "@repo/design-system/components/ui/switch";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BillingToggleProps = {
  readonly onScrollLeft?: () => void;
  readonly onScrollRight?: () => void;
  readonly showNavArrows?: boolean;
};

export function BillingToggle({
  onScrollLeft,
  onScrollRight,
  showNavArrows = false,
}: BillingToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm" htmlFor="billing-toggle">
          Monthly
        </Label>
        <Switch disabled id="billing-toggle" />
        <Label
          className="text-muted-foreground text-sm"
          htmlFor="billing-toggle"
        >
          Yearly
        </Label>
        <Badge className="bg-green-100 text-green-800" variant="secondary">
          Coming soon
        </Badge>
      </div>

      {showNavArrows === true && (
        <div className="ml-2 flex gap-1">
          <button
            className="flex h-7 w-7 items-center justify-center rounded border hover:bg-muted"
            onClick={onScrollLeft}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded border hover:bg-muted"
            onClick={onScrollRight}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
