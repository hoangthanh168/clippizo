import type { Metadata } from "next";
import { Header } from "../components/header";
import { BillingContent } from "./billing-content";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your subscription and payment history",
};

const BillingPage = () => (
  <>
    <Header page="Billing" />
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex min-h-screen flex-1 flex-col rounded-xl bg-muted/50 p-6 md:min-h-min">
        <BillingContent />
      </div>
    </div>
  </>
);

export default BillingPage;
