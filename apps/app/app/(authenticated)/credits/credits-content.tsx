"use client";

import type {
  CreditBalance,
  CreditPack,
  TransactionHistoryResponse,
} from "@repo/credits";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditsBalance,
  CreditsHistory,
  CreditsPackCard,
  ExpiringCreditsWarning,
  LowCreditsWarning,
} from "../components/credits";

export function CreditsContent() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(
    null
  );
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, historyRes, packsRes] = await Promise.all([
          fetch("/api/credits/balance"),
          fetch("/api/credits/history?limit=10"),
          fetch("/api/credits/packs"),
        ]);

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        }

        if (packsRes.ok) {
          const packsData = await packsRes.json();
          setPacks(packsData.packs || []);
        }
      } catch (error) {
        console.error("Failed to fetch credits data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handlePurchasePack = async (
    packId: string,
    provider: "paypal" | "sepay"
  ) => {
    try {
      const res = await fetch("/api/credits/packs/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, provider }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        } else if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await res.json();
        console.error("Purchase failed:", error);
        toast.error(error.message || "Failed to initiate purchase");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An error occurred while processing your purchase");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {(balance?.isLow || balance?.expiringCredits) && (
        <div className="space-y-3">
          {balance?.isLow && (
            <LowCreditsWarning currentBalance={balance.total} />
          )}
          {balance?.expiringCredits && (
            <ExpiringCreditsWarning
              amount={balance.expiringCredits.amount}
              expiresAt={balance.expiringCredits.expiresAt}
            />
          )}
        </div>
      )}

      {/* Balance & History Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {balance && <CreditsBalance balance={balance} />}
        {history && <CreditsHistory initialHistory={history} />}
      </div>

      {/* Credit Packs Section */}
      {packs.length > 0 && (
        <div>
          <h2 className="mb-2 font-semibold text-lg">Purchase Credit Packs</h2>
          <p className="mb-6 text-muted-foreground text-sm">
            Need more credits? Pack credits are used before your monthly
            allocation and are valid for 90 days.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <CreditsPackCard
                key={pack.id}
                onPurchase={handlePurchasePack}
                pack={pack}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
