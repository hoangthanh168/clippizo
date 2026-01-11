"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type LowCreditsWarningProps = {
  readonly currentBalance: number;
  readonly dismissible?: boolean;
};

export function LowCreditsWarning({
  currentBalance,
  dismissible = true,
}: LowCreditsWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
      <AlertTriangle className="text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="flex items-center justify-between">
        <span>Low Credits Balance</span>
        {dismissible && (
          <Button
            aria-label="Dismiss"
            className="h-6 w-6 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900 dark:hover:text-yellow-200"
            onClick={() => setDismissed(true)}
            size="icon-sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <p>
          You have only <span className="font-semibold">{currentBalance}</span>{" "}
          credits remaining. Purchase a credit pack to continue using AI
          features without interruption.
        </p>
        <Button
          asChild
          className="h-auto p-0 text-yellow-800 dark:text-yellow-200"
          variant="link"
        >
          <Link href="/upgrade">Purchase Credits</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
