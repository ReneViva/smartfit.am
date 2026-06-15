import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "../lib/seo";

const publicPages = [
  { changeFrequency: "weekly", path: "/", priority: 1 },
  { changeFrequency: "monthly", path: "/about", priority: 0.7 },
  { changeFrequency: "weekly", path: "/coaches", priority: 0.8 },
  { changeFrequency: "weekly", path: "/packages", priority: 0.9 },
  { changeFrequency: "weekly", path: "/gallery", priority: 0.8 },
  { changeFrequency: "monthly", path: "/contact", priority: 0.7 },
  { changeFrequency: "daily", path: "/our-app", priority: 0.9 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date();

  return publicPages.map((page) => ({
    changeFrequency: page.changeFrequency,
    lastModified: generatedAt,
    priority: page.priority,
    url: getAbsoluteUrl(page.path),
  }));
}
