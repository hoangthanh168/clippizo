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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-500" />
          {pack.name}
        </CardTitle>
        <CardDescription>
          <span className="font-bold text-3xl text-foreground">
            {pack.credits}
          </span>
          <span className="ml-1">credits</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Check className="h-4 w-4 text-green-500" />
          <span>Valid for {pack.validityDays} days</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Check className="h-4 w-4 text-green-500" />
          <span>Used before monthly credits</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Check className="h-4 w-4 text-green-500" />
          <span>No subscription required</span>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <div className="text-center">
          <span className="font-bold text-2xl">
            {formatPrice(pack.priceUSD, "USD")}
          </span>
          <span className="ml-1 text-muted-foreground text-sm">
            (~{formatPrice(pack.priceVND, "VND")})
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
