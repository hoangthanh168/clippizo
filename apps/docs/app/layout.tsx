import "./styles.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html
    className={`${GeistSans.variable} ${GeistMono.variable}`}
    lang="en"
    suppressHydrationWarning
  >
    <body className="flex min-h-screen flex-col font-sans antialiased">
      <RootProvider>{children}</RootProvider>
      <SpeedInsights />
    </body>
  </html>
);

export default RootLayout;
