import type { Metadata } from "next";

export const SITE_NAME = "Smartfit.am";
export const DEFAULT_SITE_TITLE =
  "Smartfit.am — Gym, Fitness Packages, Coaches & Live Occupancy";
export const DEFAULT_SITE_DESCRIPTION =
  "Explore Smartfit.am gym packages, coaches, gallery, contact information, and live occupancy to plan your next training visit.";
export const PUBLIC_SHARE_IMAGE_PATH = "/logo/Logo.svg";
export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/coaches",
  "/packages",
  "/gallery",
  "/contact",
  "/our-app",
] as const;

const DEFAULT_SITE_URL = "https://smartfit.am";

export function getSiteUrl() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(configuredSiteUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new URL(DEFAULT_SITE_URL);
    }

    return new URL(url.origin);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function getAbsoluteUrl(path = "/") {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  return new URL(normalizedPath, getSiteUrl()).toString();
}

export function createPublicMetadata({
  description,
  path,
  title,
}: {
  description: string;
  path: string;
  title: string;
}): Metadata {
  const canonicalUrl = getAbsoluteUrl(path);
  const shareImageUrl = getAbsoluteUrl(PUBLIC_SHARE_IMAGE_PATH);

  return {
    alternates: {
      canonical: canonicalUrl,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: "Smartfit.am logo",
          url: shareImageUrl,
        },
      ],
      siteName: SITE_NAME,
      title,
      type: "website",
      url: canonicalUrl,
    },
    title: {
      absolute: title,
    },
    twitter: {
      card: "summary",
      description,
      images: [shareImageUrl],
      title,
    },
  };
}

export function createPrivateMetadata(title: string): Metadata {
  return {
    robots: {
      follow: false,
      googleBot: {
        follow: false,
        index: false,
        noimageindex: true,
      },
      index: false,
      nocache: true,
    },
    title: {
      absolute: title,
    },
  };
}

export function createBreadcrumbJsonLd(name: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: getAbsoluteUrl("/"),
        name: "Home",
        position: 1,
      },
      {
        "@type": "ListItem",
        item: getAbsoluteUrl(path),
        name,
        position: 2,
      },
    ],
  };
}
