import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../components/header";
import { CheckoutContent } from "./checkout-content";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase",
};

export default function CheckoutPage() {
  return (
    <>
      <Header page="Checkout" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min">
          <div className="mx-auto max-w-2xl">
            <Suspense
              fallback={
                <div className="flex min-h-[400px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <CheckoutContent />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
