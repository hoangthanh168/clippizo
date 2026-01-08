import type { Metadata } from "next";
import { Header } from "../components/header";
import { CreditsContent } from "./credits-content";

export const metadata: Metadata = {
  title: "Credits",
  description: "Manage your credits balance and purchase credit packs",
};

const CreditsPage = () => (
  <>
    <Header page="Credits" />
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min">
        <CreditsContent />
      </div>
    </div>
  </>
);

export default CreditsPage;
