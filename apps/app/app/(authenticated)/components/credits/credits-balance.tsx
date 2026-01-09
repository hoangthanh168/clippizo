"use client";

import type { CreditBalance } from "@repo/credits";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { AlertTriangle, Coins } from "lucide-react";

type CreditsBalanceProps = {
  readonly balance: CreditBalance;
};

export function CreditsBalance({ balance }: CreditsBalanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Credits Balance
        </CardTitle>
        <CardDescription>Your current available credits</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg bg-muted/50 p-6 text-center">
          <span className="font-bold text-5xl">{balance.total}</span>
          <p className="mt-1 text-muted-foreground">credits available</p>
          {balance.isLow === true && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Low balance - consider purchasing a credit pack</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
