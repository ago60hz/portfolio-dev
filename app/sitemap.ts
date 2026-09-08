import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/content/case-studies";
import { SITE_ORIGIN } from "@/lib/site";

/**
 * Six URLs: the kitchen, and one per case study.
 *
 * Generated from CASE_STUDIES rather than written out, for the same reason
 * `generateStaticParams` reads it -- a study added to that array is a study in
 * the sitemap, and the two cannot drift.
 *
 * `lastModified` is build time. The content is compiled into the bundle, so a
 * change to a study only reaches the web through a deploy, which makes the
 * build the honest answer to "when did this last change".
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_ORIGIN,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...CASE_STUDIES.map((study) => ({
      url: `${SITE_ORIGIN}/work/${study.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
