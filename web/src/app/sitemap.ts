import type { MetadataRoute } from "next";

const SITE = "https://www.veymark.xyz";

/**
 * Only the pages a search engine should land on.
 *
 * /v is left out because a verification screen means nothing without the tag
 * payload that produced it, and /dashboard is a private panel.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE}/demo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
