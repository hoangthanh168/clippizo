import type { Metadata } from "next";
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
        <div className="flex min-h-screen flex-1 flex-col rounded-xl bg-muted/50 p-6 md:min-h-min">
          <div className="mx-auto max-w-2xl">
            <CheckoutContent />
          </div>
        </div>
      </div>
    </>
  );
}
