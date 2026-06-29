import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
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
import {
  normalizeTheme,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from "../lib/theme";
import "./globals.css";

const themeInitScript = `
(() => {
  const cookieName = ${JSON.stringify(THEME_COOKIE_NAME)};
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const maxAge = 60 * 60 * 24 * 365;
  const normalizeTheme = (value) =>
    value === "dark" || value === "light" ? value : null;
  const getCookieTheme = () => {
    const themeCookie = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(cookieName + "="));

    if (!themeCookie) {
      return null;
    }

    return normalizeTheme(themeCookie.split("=").slice(1).join("="));
  };

  let storedTheme = null;

  try {
    storedTheme = normalizeTheme(window.localStorage.getItem(storageKey));
  } catch {}

  const theme = storedTheme || getCookieTheme() || "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.cookie =
    cookieName + "=" + theme + "; Path=/; Max-Age=" + maxAge + "; SameSite=Lax";
})();
`;

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialTheme =
    normalizeTheme(cookieStore.get(THEME_COOKIE_NAME)?.value) ?? "light";

  return (
    <html
      className={initialTheme === "dark" ? "dark" : undefined}
      data-theme={initialTheme}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <Script
          id="smartfit-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
