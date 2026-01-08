"use client";

import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LowCreditsWarningProps = {
  currentBalance: number;
  dismissible?: boolean;
};

export function LowCreditsWarning({
  currentBalance,
  dismissible = true,
}: LowCreditsWarningProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
        <div className="flex-grow">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
            Low Credits Balance
          </h4>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            You have only{" "}
            <span className="font-semibold">{currentBalance}</span> credits
            remaining. Purchase a credit pack to continue using AI features
            without interruption.
          </p>
          <button
            className="mt-2 font-medium text-sm text-yellow-800 underline hover:no-underline dark:text-yellow-200"
            onClick={() => router.push("/credits")}
            type="button"
          >
            Purchase Credits
          </button>
        </div>
        {dismissible === true ? (
          <button
            aria-label="Dismiss"
            className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
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
