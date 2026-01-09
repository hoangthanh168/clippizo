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
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SePayCancelPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <XCircle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>

        <CardContent />

        <CardFooter className="flex-col gap-2">
          <Button className="w-full" onClick={() => router.push("/pricing")}>
            Try again
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Return home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
