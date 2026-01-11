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
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Package className="h-4 w-4 text-purple-500 sm:h-5 sm:w-5" />
          {pack.name}
        </CardTitle>
        <CardDescription>
          <span className="font-bold text-2xl text-foreground sm:text-3xl">
            {pack.credits.toLocaleString()}
          </span>
          <span className="ml-1 text-xs sm:text-sm">credits</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-1.5 p-4 pt-0 sm:space-y-2 sm:p-6 sm:pt-0">
        <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Check className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
          <span>Valid for {pack.validityDays} days</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Check className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
          <span>Used before monthly credits</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Check className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
          <span>No subscription required</span>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 p-4 pt-0 sm:gap-3 sm:p-6 sm:pt-0">
        <div className="text-center">
          <span className="font-bold text-xl sm:text-2xl">
            {formatPrice(pack.priceUSD, "USD")}
          </span>
        </div>
        <Button
          className="w-full"
          onClick={() => router.push(`/checkout?type=pack&id=${pack.id}`)}
        >
          Buy Now
        </Button>
      </CardFooter>
    </Card>
  );
}
