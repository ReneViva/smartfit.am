import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeInit } from "../components/public/theme-init";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  getAbsoluteUrl,
  getSiteUrl,
  PUBLIC_SHARE_IMAGE_PATH,
  SITE_NAME,
} from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  description: DEFAULT_SITE_DESCRIPTION,
  icons: {
    icon: "/logo/S.svg",
  },
  manifest: "/manifest.webmanifest",
  metadataBase: getSiteUrl(),
  openGraph: {
    description: DEFAULT_SITE_DESCRIPTION,
    images: [
      {
        alt: "Smartfit.am logo",
        url: getAbsoluteUrl(PUBLIC_SHARE_IMAGE_PATH),
      },
    ],
    siteName: SITE_NAME,
    title: DEFAULT_SITE_TITLE,
    type: "website",
    url: getAbsoluteUrl("/"),
  },
  title: {
    default: DEFAULT_SITE_TITLE,
    template: "%s | Smartfit.am",
  },
  twitter: {
    card: "summary",
    description: DEFAULT_SITE_DESCRIPTION,
    images: [getAbsoluteUrl(PUBLIC_SHARE_IMAGE_PATH)],
    title: DEFAULT_SITE_TITLE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
