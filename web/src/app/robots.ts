import type { MetadataRoute } from "next";

const SITE = "https://www.veymark.xyz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The panel is private and a verification screen is meaningless without
      // the tag payload behind it.
      disallow: ["/dashboard", "/v", "/api"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
