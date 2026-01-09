"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Check, CreditCard, Package } from "lucide-react";
import type { PaymentProvider } from "./checkout-content";

type SubscriptionProduct = {
  type: "subscription";
  data: {
    id: string;
    name: string;
    priceVND: number;
    priceUSD: number;
    durationDays: number;
    features: readonly string[];
  };
};

type PackProduct = {
  type: "pack";
  data: {
    id: string;
    name: string;
    credits: number;
    priceUSD: number;
    priceVND: number;
    validityDays: number;
    features: readonly string[];
  };
};

type Product = SubscriptionProduct | PackProduct;

type OrderSummaryProps = {
  readonly product: Product;
  readonly provider: PaymentProvider;
  readonly isRenewal?: boolean;
};

export function OrderSummary({
  product,
  provider,
  isRenewal,
}: OrderSummaryProps) {
  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const priceUSD = product.data.priceUSD;
  const priceVND = product.data.priceVND;
  const primaryPrice = provider === "paypal" ? priceUSD : priceVND;
  const primaryCurrency = provider === "paypal" ? "USD" : "VND";
  const secondaryPrice = provider === "paypal" ? priceVND : priceUSD;
  const secondaryCurrency = provider === "paypal" ? "VND" : "USD";

  const duration =
    product.type === "subscription"
      ? `${product.data.durationDays} days`
      : `${product.data.validityDays} days validity`;

  const Icon = product.type === "subscription" ? CreditCard : Package;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your purchase details</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Info */}
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="flex items-center gap-2 font-semibold text-lg">
              {product.data.name}
              {isRenewal === true && (
                <Badge variant="secondary">Renewal</Badge>
              )}
            </h3>
            <p className="text-muted-foreground text-sm">{duration}</p>
          </div>
        </div>

        {/* Price */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Price</span>
            <div className="text-right">
              <span className="font-bold text-2xl">
                {formatPrice(primaryPrice, primaryCurrency)}
              </span>
              <span className="ml-2 text-muted-foreground text-sm">
                (~{formatPrice(secondaryPrice, secondaryCurrency)})
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="mb-3 font-medium text-sm">What you&apos;ll get:</h4>
          <ul className="space-y-2">
            {product.data.features.map((feature) => (
              <li className="flex items-center gap-2 text-sm" key={feature}>
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
