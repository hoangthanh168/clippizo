"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PayPalCancelPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="h-16 w-16 text-yellow-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">Payment Cancelled</h1>

        <p className="mb-6 text-muted-foreground">
          Your PayPal payment was cancelled. No charges were made.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Try again
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground underline"
          >
            Return home
          </button>
        </div>
      </div>
    </div>
  );
}
