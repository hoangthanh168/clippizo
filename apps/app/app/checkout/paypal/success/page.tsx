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
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayPalSuccessPage() {
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your subscription has been activated.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Spinner className="h-4 w-4" />
            <span>Redirecting to billing in {countdown}s...</span>
          </div>
        </CardContent>

        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => router.push("/billing")}>
            Go to billing now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
