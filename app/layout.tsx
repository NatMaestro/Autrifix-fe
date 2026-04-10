import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

import { AuroraBackdrop } from "@/components/brand/aurora-backdrop";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "AutriFix — Roadside, reimagined",
  description:
    "Real-time roadside assistance. Drivers meet mechanics on a live map — Accra-first, built for urgency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} min-h-dvh font-inter antialiased`}
      >
        <AppProviders>
          <AuroraBackdrop />
          <div className="relative z-0 min-h-dvh">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
