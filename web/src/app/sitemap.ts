import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

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
    {
      url: `${SITE}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getAllPosts().map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
