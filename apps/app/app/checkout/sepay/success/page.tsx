"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function SePaySuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const invoice = searchParams.get("invoice");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/billing");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">Payment Successful!</h1>

        <p className="mb-4 text-muted-foreground">
          Thank you for your purchase. Your subscription has been activated.
        </p>

        {invoice && (
          <p className="mb-6 text-sm text-muted-foreground">
            Invoice: {invoice}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting to billing in {countdown}s...</span>
        </div>

        <button
          type="button"
          onClick={() => router.push("/billing")}
          className="mt-4 text-sm text-primary underline"
        >
          Go to billing now
        </button>
      </div>
    </div>
  );
}
