import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { calculators } from "@/lib/calculators";
import { verticals } from "@/lib/verticals";
import { SITE_URL } from "@/lib/site";

const LATEST = calculators
  .map((c) => c.updatedAt)
  .sort()
  .at(-1) as string;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LATEST,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...verticals.map((v) => ({
      url: `${SITE_URL}/${v.slug}`,
      lastModified: LATEST,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...calculators.map((c) => ({
      url: `${SITE_URL}/${c.vertical}/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/learn`,
      lastModified: LATEST,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    ...articles.map((a) => ({
      url: `${SITE_URL}/learn/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/about`, lastModified: LATEST, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: LATEST, priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: LATEST, priority: 0.3 },
  ];
}
