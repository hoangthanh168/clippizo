"use client";

import type { CreditPack } from "@repo/credits";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Check, Package } from "lucide-react";
import { useRouter } from "next/navigation";

type CreditsPackCardProps = {
  readonly pack: CreditPack;
};

export function CreditsPackCard({ pack }: CreditsPackCardProps) {
  const router = useRouter();

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm sm:text-base">
          <Package className="h-4 w-4 shrink-0 text-purple-500 sm:h-5 sm:w-5" />
          <span className="truncate">{pack.name}</span>
        </CardTitle>
        <CardDescription className="flex items-baseline gap-1">
          <span className="whitespace-nowrap font-bold text-xl text-foreground sm:text-2xl">
            {pack.credits.toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm">credits</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-1 p-3 pt-0 sm:space-y-1.5 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:gap-2 sm:text-sm">
          <Check className="h-3 w-3 shrink-0 text-green-500 sm:h-4 sm:w-4" />
          <span>Valid for {pack.validityDays} days</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:gap-2 sm:text-sm">
          <Check className="h-3 w-3 shrink-0 text-green-500 sm:h-4 sm:w-4" />
          <span>Used before monthly credits</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:gap-2 sm:text-sm">
          <Check className="h-3 w-3 shrink-0 text-green-500 sm:h-4 sm:w-4" />
          <span>No subscription required</span>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 p-3 pt-0 sm:gap-3 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
        <div className="text-center">
          <span className="whitespace-nowrap font-bold text-lg sm:text-xl">
            {formatPrice(pack.priceUSD, "USD")}
          </span>
        </div>
        <Button
          className="w-full text-sm"
          onClick={() => router.push(`/checkout?type=pack&id=${pack.id}`)}
        >
          Buy Now
        </Button>
      </CardFooter>
    </Card>
  );
}
