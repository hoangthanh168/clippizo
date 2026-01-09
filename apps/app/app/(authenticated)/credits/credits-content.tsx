"use client";

import type { CreditBalance, CreditPack } from "@repo/credits";
import {
  Card,
  CardContent,
  CardHeader,
} from "@repo/design-system/components/ui/card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  CreditsBalance,
  CreditsPackCard,
  ExpiringCreditsWarning,
  LowCreditsWarning,
} from "../components/credits";

function CreditsBalanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted/50 p-6 text-center">
          <Skeleton className="mx-auto h-12 w-24" />
          <Skeleton className="mx-auto mt-2 h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function CreditsPackSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <div className="space-y-3 p-6 pt-0">
        <Skeleton className="mx-auto h-6 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}

export function CreditsContent() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, packsRes] = await Promise.all([
          fetch("/api/credits/balance"),
          fetch("/api/credits/packs"),
        ]);

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Balance Skeleton */}
        <div className="mx-auto max-w-md">
          <CreditsBalanceSkeleton />
        </div>

        {/* Credit Packs Skeleton */}
        <div>
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="mb-6 h-4 w-96" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
          </div>
        </div>
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

      {/* Balance Card */}
      {balance && (
        <div className="mx-auto max-w-md">
          <CreditsBalance balance={balance} />
        </div>
      )}

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
              <CreditsPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
