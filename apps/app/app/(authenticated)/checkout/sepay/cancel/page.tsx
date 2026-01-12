import type { Metadata } from "next";
import { Header } from "../../../components/header";
import { SePayCancelContent } from "./cancel-content";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  description: "Your payment was cancelled",
};

export default function SePayCancelPage() {
  return (
    <>
      <Header page="Payment Cancelled" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex min-h-screen flex-1 items-center justify-center rounded-xl bg-muted/50 p-6 md:min-h-min">
          <SePayCancelContent />
        </div>
      </div>
    </>
  );
}
