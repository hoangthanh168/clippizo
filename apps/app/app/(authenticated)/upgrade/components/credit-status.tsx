"use client";

import type { CreditBalance } from "@repo/credits";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Calendar, Coins, Settings } from "lucide-react";
import Link from "next/link";

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
  const plan = subscription?.plan ?? "free";
  const creditsTotal = credits?.total ?? 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm">
        <Coins className="h-4 w-4 text-muted-foreground" />
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
          <Calendar className="ml-6 h-3 w-3" />
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

      <p className="ml-6 text-muted-foreground text-xs">
        Subscribe for more credits and full access to all features
      </p>

      <Button asChild className="mt-2 ml-6 w-fit" size="sm" variant="outline">
        <Link href="/billing">
          <Settings className="mr-2 h-3 w-3" />
          Manage subscription
        </Link>
      </Button>
    </div>
  );
}
