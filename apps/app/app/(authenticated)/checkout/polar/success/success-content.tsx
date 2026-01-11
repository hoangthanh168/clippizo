"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Spinner } from "@repo/design-system/components/ui/spinner";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PolarSuccessContent() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/billing");
    }
  }, [countdown, router]);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        <CardDescription>
          Thank you for your purchase. Your subscription will be activated
          shortly.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-3 text-primary text-sm">
          <RefreshCw className="h-4 w-4" />
          <span>Auto-renewing subscription via Polar</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Spinner className="h-4 w-4" />
          <span>Redirecting to billing in {countdown}s...</span>
        </div>
      </CardContent>

      <CardFooter className="justify-center">
        <Button onClick={() => router.push("/billing")} variant="link">
          Go to billing now
        </Button>
      </CardFooter>
    </Card>
  );
}
