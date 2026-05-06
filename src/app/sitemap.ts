import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

// ISR — regenerate the sitemap at most once an hour. Without this,
// Next.js renders sitemap() ONCE at build time on the GH Actions
// runner (where there's no DB), the try/catch falls through to the
// marketing-only static entries, and the snapshot ships frozen until
// the next deploy. New posts created via the admin UI would then be
// invisible to crawlers until somebody pushed a commit. With
// revalidate=3600 the droplet regenerates its own copy every hour
// against the live DB, so a post published at 14:05 reaches the
// sitemap before 15:05.
export const revalidate = 3600;

/**
 * Sitemap. Static marketing pages + per-post + per-tag entries pulled
 * live from the DB. `lastModified` = `updatedAt` when set, otherwise
 * `publishedAt` — Google uses this signal to decide whether to recrawl,
 * so we want it to actually move when an editor saves a post.
 *
 * Drafts and future-scheduled posts are filtered out so the public
 * sitemap matches what /blog actually surfaces.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let postEntries: MetadataRoute.Sitemap = [];
  let tagEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        locale: "en",
        status: "published",
        publishedAt: { lte: now },
      },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    postEntries = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const tags = await prisma.blogTag.findMany({
      where: { locale: "en" },
      select: { slug: true, createdAt: true },
    });
    tagEntries = tags.map((t) => ({
      url: `${SITE_URL}/blog/tag/${encodeURIComponent(t.slug)}`,
      lastModified: t.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch (err) {
    // DB unavailable at build time? Ship the static entries and let the
    // next regeneration pick the dynamic ones up. Better than 500-ing the
    // /sitemap.xml endpoint and hurting crawl frequency.
    console.warn("sitemap: failed to load blog rows", err);
  }

  return [...staticEntries, ...postEntries, ...tagEntries];
}
