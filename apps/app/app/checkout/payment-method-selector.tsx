"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Label } from "@repo/design-system/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/design-system/components/ui/radio-group";
import type { PaymentProvider } from "./checkout-content";

type PaymentMethodSelectorProps = {
  readonly value: PaymentProvider;
  readonly onChange: (value: PaymentProvider) => void;
};

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>Select your preferred payment option</CardDescription>
      </CardHeader>

      <CardContent>
        <RadioGroup
          onValueChange={(v) => onChange(v as PaymentProvider)}
          value={value}
          className="space-y-3"
        >
          <Label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              value === "sepay"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            htmlFor="sepay"
          >
            <RadioGroupItem id="sepay" value="sepay" />
            <div className="flex-1">
              <span className="font-medium text-base">SePay</span>
              <p className="text-muted-foreground text-sm">
                Pay with VND - Vietnam payment gateway
              </p>
            </div>
          </Label>

          <Label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              value === "paypal"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            htmlFor="paypal"
          >
            <RadioGroupItem id="paypal" value="paypal" />
            <div className="flex-1">
              <span className="font-medium text-base">PayPal</span>
              <p className="text-muted-foreground text-sm">
                Pay with USD - International payment
              </p>
            </div>
          </Label>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
