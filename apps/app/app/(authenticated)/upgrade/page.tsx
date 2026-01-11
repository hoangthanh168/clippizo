import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
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
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min">
          <Suspense
            fallback={
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <UpgradeContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
