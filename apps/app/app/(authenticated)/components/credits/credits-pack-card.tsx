"use client";

import type { CreditPack } from "@repo/credits";
import { Check, Loader2, Package } from "lucide-react";
import { useState } from "react";

type CreditsPackCardProps = {
  pack: CreditPack;
  onPurchase: (packId: string, provider: "paypal" | "sepay") => Promise<void>;
};

export function CreditsPackCard({ pack, onPurchase }: CreditsPackCardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    "paypal" | "sepay" | null
  >(null);

  const handlePurchase = async (provider: "paypal" | "sepay") => {
    setLoading(true);
    setSelectedProvider(provider);
    try {
      await onPurchase(pack.id, provider);
    } finally {
      setLoading(false);
      setSelectedProvider(null);
    }
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);

  return (
    <div className="flex flex-col rounded-xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold text-lg">{pack.name}</h3>
      </div>

      <div className="mb-4">
        <span className="font-bold text-3xl">{pack.credits}</span>
        <span className="ml-1 text-muted-foreground">credits</span>
      </div>

      <div className="mb-4 flex-grow space-y-2">
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
      </div>

      <div className="mb-4 text-center">
        <span className="font-bold text-2xl">
          {formatPrice(pack.priceUSD, "USD")}
        </span>
        <span className="ml-1 text-muted-foreground text-sm">
          (~{formatPrice(pack.priceVND, "VND")})
        </span>
      </div>

      <div className="space-y-2">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0070ba] px-4 py-2 font-medium text-sm text-white hover:bg-[#003087] disabled:opacity-50"
          disabled={loading}
          onClick={() => handlePurchase("paypal")}
          type="button"
        >
          {loading === true && selectedProvider === "paypal" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Pay with PayPal"
          )}
        </button>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 font-medium text-sm hover:bg-muted disabled:opacity-50"
          disabled={loading}
          onClick={() => handlePurchase("sepay")}
          type="button"
        >
          {loading === true && selectedProvider === "sepay" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Pay with SePay (VND)"
          )}
        </button>
      </div>
    </div>
  );
}
