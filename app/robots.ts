import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

/**
 * Everything is public, so the only work this does is point crawlers at the
 * sitemap. Without it they still find the case studies by following links from
 * the kitchen, but they find them slower and with no sense of what is complete.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
