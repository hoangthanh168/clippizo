"use client";

import { Clock, X } from "lucide-react";
import { useState } from "react";

type ExpiringCreditsWarningProps = {
  amount: number;
  expiresAt: Date | string;
  dismissible?: boolean;
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
    <div className="relative rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-500" />
        <div className="flex-grow">
          <h4 className="font-medium text-orange-800 dark:text-orange-200">
            Credits Expiring Soon
          </h4>
          <p className="mt-1 text-orange-700 text-sm dark:text-orange-300">
            <span className="font-semibold">{amount}</span> credits will expire{" "}
            {daysUntilExpiry <= 1 ? (
              <span className="font-semibold">tomorrow</span>
            ) : (
              <>
                in <span className="font-semibold">{daysUntilExpiry} days</span>
              </>
            )}{" "}
            on {formatDate(expireDate)}. Use them before they expire!
          </p>
        </div>
        {dismissible === true ? (
          <button
            aria-label="Dismiss"
            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
            onClick={() => setDismissed(true)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
