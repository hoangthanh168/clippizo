import type { Metadata } from "next";
import { Header } from "../components/header";
import { UpgradeContent } from "./upgrade-content";

export const metadata: Metadata = {
  title: "Upgrade",
  description: "Choose the plan that best fits your needs",
};

export default function UpgradePage() {
  return (
    <>
      <Header page="Upgrade" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex min-h-screen flex-1 flex-col rounded-xl bg-muted/50 p-6 md:min-h-min">
          <UpgradeContent />
        </div>
      </div>
    </>
  );
}
