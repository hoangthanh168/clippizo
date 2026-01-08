"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SePayCancelPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="h-16 w-16 text-yellow-500" />
        </div>

        <h1 className="mb-2 font-bold text-2xl">Payment Cancelled</h1>

        <p className="mb-6 text-muted-foreground">
          Your payment was cancelled. No charges were made to your account.
        </p>

        <div className="flex flex-col gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => router.push("/pricing")}
            type="button"
          >
            Try again
          </button>

          <button
            className="text-muted-foreground text-sm underline"
            onClick={() => router.push("/")}
            type="button"
          >
            Return home
          </button>
        </div>
      </div>
    </div>
  );
}
