"use client";

import type { CreditBalance } from "@repo/credits";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Calendar, Package, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreditsPackDialog } from "./credits-pack-dialog";

type SubscriptionInfo = {
  plan: string;
  status: string | null;
  expiresAt: string | null;
  isActive: boolean;
  daysRemaining: number | null;
};

type CreditStatusProps = {
  readonly subscription: SubscriptionInfo | null;
  readonly credits: CreditBalance | null;
};

const getPlanBadgeVariant = (plan: string) => {
  switch (plan) {
    case "enterprise":
      return "default";
    case "pro":
      return "secondary";
    default:
      return "outline";
  }
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export function CreditStatus({ subscription, credits }: CreditStatusProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const plan = subscription?.plan ?? "free";
  const creditsTotal = credits?.total ?? 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 text-sm">
        <span>
          There are <strong>{creditsTotal.toLocaleString()} credits</strong>{" "}
          remaining on your
        </span>
        <Badge className="capitalize" variant={getPlanBadgeVariant(plan)}>
          {plan}
        </Badge>
        <span>plan</span>
      </div>

      {subscription !== null &&
      subscription.expiresAt !== null &&
      subscription.isActive === true ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Calendar className="h-3 w-3" />
          <span>
            Your subscription renews on {formatDate(subscription.expiresAt)}
          </span>
          {subscription.daysRemaining !== null &&
            subscription.daysRemaining > 0 && (
              <span className="text-primary">
                ({subscription.daysRemaining} days remaining)
              </span>
            )}
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Subscribe for more credits and full access to all features
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/billing">
            <Settings className="mr-2 h-3 w-3" />
            Manage subscription
          </Link>
        </Button>
        <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline">
          <Package className="mr-2 h-3 w-3" />
          Buy Credits
        </Button>
      </div>

      <CreditsPackDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
