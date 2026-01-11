"use client";

import type { CreditPack } from "@repo/credits";
import {
  Card,
  CardContent,
  CardHeader,
} from "@repo/design-system/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { useEffect, useState } from "react";
import { CreditsPackCard } from "../../components/credits";

type CreditsPackDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

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

export function CreditsPackDialog({
  open,
  onOpenChange,
}: CreditsPackDialogProps) {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function fetchPacks() {
      setLoading(true);
      try {
        const res = await fetch("/api/credits/packs");
        if (res.ok) {
          const data = await res.json();
          setPacks(data.packs || []);
        }
      } catch (error) {
        console.error("Failed to fetch credit packs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPacks();
  }, [open]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto p-4 sm:w-auto sm:max-w-4xl sm:p-6 lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Purchase Credit Packs</DialogTitle>
          <DialogDescription>
            Need more credits? Pack credits are used before your monthly
            allocation and are valid for 90 days.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
            <CreditsPackSkeleton />
          </div>
        ) : packs.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {packs.map((pack) => (
              <CreditsPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            No credit packs available at the moment.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
