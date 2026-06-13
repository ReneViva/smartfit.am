import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  description: "Smartfit.am gym website and management system",
  icons: {
    icon: "/logo/Logo.svg",
  },
  manifest: "/manifest.webmanifest",
  title: "Smartfit.am",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
