import { Separator } from "@repo/design-system/components/ui/separator";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";

type HeaderProps = {
  readonly page: string;
  readonly children?: ReactNode;
};

export const Header = ({ page, children }: HeaderProps) => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2">
    <div className="flex items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator className="mr-2 h-4" orientation="vertical" />
      <h1 className="font-semibold text-lg">{page}</h1>
    </div>
    {children}
  </header>
);
