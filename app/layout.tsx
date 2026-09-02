import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { satoshi, gochiHand, doto, danfo } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praise Fabilola / 'JO'DISCO",
  description:
    "Founding Designer who takes work from first sketch to the bottom line. Product, brand, and the front-end that ties it together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${gochiHand.variable} ${doto.variable} ${danfo.variable}`}
    >
      <body className="font-satoshi antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
