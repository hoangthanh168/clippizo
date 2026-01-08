"use client";

import type { CreditBalance } from "@repo/credits";
import { AlertTriangle, Calendar, Coins, Package } from "lucide-react";

type CreditsBalanceProps = {
  balance: CreditBalance;
};

export function CreditsBalance({ balance }: CreditsBalanceProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-xl">Credits Balance</h2>
      </div>

      {/* Total Balance */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-4xl">{balance.total}</span>
          <span className="text-muted-foreground">credits available</span>
        </div>
        {balance.isLow === true ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Low balance - consider purchasing a credit pack</span>
          </div>
        ) : null}
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        <h3 className="font-medium text-muted-foreground text-sm">Breakdown</h3>

        {/* Monthly Credits */}
        {balance.breakdown.monthly && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <span className="font-medium">Monthly Credits</span>
                <p className="text-muted-foreground text-sm">
                  Expires {formatDate(balance.breakdown.monthly.expiresAt)}
                </p>
              </div>
            </div>
            <span className="font-semibold text-lg">
              {balance.breakdown.monthly.amount}
            </span>
          </div>
        )}

        {/* Pack Credits */}
        {balance.breakdown.pack && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <span className="font-medium">Pack Credits</span>
                <p className="text-muted-foreground text-sm">
                  Expires {formatDate(balance.breakdown.pack.expiresAt)}
                </p>
              </div>
            </div>
            <span className="font-semibold text-lg">
              {balance.breakdown.pack.amount}
            </span>
          </div>
        )}

        {/* No Credits */}
        {!(balance.breakdown.monthly || balance.breakdown.pack) && (
          <p className="text-muted-foreground text-sm">
            No active credit sources
          </p>
        )}
      </div>
    </div>
  );
}
