import "./styles.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
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
    <body className="flex flex-col min-h-screen font-sans antialiased">
      <RootProvider>{children}</RootProvider>
    </body>
  </html>
);

export default RootLayout;
