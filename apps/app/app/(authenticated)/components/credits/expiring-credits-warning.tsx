"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import { Clock, X } from "lucide-react";
import { useState } from "react";

type ExpiringCreditsWarningProps = {
  readonly amount: number;
  readonly expiresAt: Date | string;
  readonly dismissible?: boolean;
};

export function ExpiringCreditsWarning({
  amount,
  expiresAt,
  dismissible = true,
}: ExpiringCreditsWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const expireDate =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
      <Clock className="text-orange-600 dark:text-orange-500" />
      <AlertTitle className="flex items-center justify-between">
        <span>Credits Expiring Soon</span>
        {dismissible && (
          <Button
            aria-label="Dismiss"
            className="h-6 w-6 text-orange-600 hover:bg-orange-100 hover:text-orange-800 dark:text-orange-400 dark:hover:bg-orange-900 dark:hover:text-orange-200"
            onClick={() => setDismissed(true)}
            size="icon-sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        <span className="font-semibold">{amount}</span> credits will expire{" "}
        {daysUntilExpiry <= 1 ? (
          <span className="font-semibold">tomorrow</span>
        ) : (
          <>
            in <span className="font-semibold">{daysUntilExpiry} days</span>
          </>
        )}{" "}
        on {formatDate(expireDate)}. Use them before they expire!
      </AlertDescription>
    </Alert>
  );
}
