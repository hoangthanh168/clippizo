import { Spinner } from "@repo/design-system/components/ui/spinner";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../../../components/header";
import { PayPalSuccessContent } from "./success-content";

export const metadata: Metadata = {
  title: "Payment Success",
  description: "Your payment was successful",
};

export default function PayPalSuccessPage() {
  return (
    <>
      <Header page="Payment Success" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex min-h-screen flex-1 items-center justify-center rounded-xl bg-muted/50 p-6 md:min-h-min">
          <Suspense fallback={<Spinner />}>
            <PayPalSuccessContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
