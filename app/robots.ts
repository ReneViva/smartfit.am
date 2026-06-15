import type { MetadataRoute } from "next";

import { getAbsoluteUrl, getSiteUrl, PUBLIC_ROUTES } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    host: getSiteUrl().origin,
    rules: {
      allow: [...PUBLIC_ROUTES],
      disallow: [
        "/admin",
        "/registration",
        "/login",
        "/api/admin",
        "/api/internal",
      ],
      userAgent: "*",
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
