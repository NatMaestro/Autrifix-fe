import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

import { AuroraBackdrop } from "@/components/brand/aurora-backdrop";
import { AppProviders } from "@/components/providers/app-providers";
import { getMetadataBase } from "@/lib/site-url";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const defaultTitle = "AutriFix — Roadside, reimagined";
const defaultDescription =
  "Real-time roadside assistance. Drivers meet mechanics on a live map — request help, get matched, chat on the job, and close out when you are moving again.";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: defaultTitle,
    template: "%s · AutriFix",
  },
  description: defaultDescription,
  applicationName: "AutriFix",
  authors: [{ name: "AutriFix" }],
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: "/icon",
    apple: "/apple-icon",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AutriFix",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/brand/AutriFix-logo-n.png",
        width: 1024,
        height: 683,
        alt: "AutriFix",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/brand/AutriFix-logo-n.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef4ff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
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
