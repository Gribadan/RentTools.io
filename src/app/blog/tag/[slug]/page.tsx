import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing-header";
import { prisma } from "@/lib/prisma";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/alternates";

const PAGE_SIZE = 12;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

// Tag pages with fewer than this many posts get `noindex` and are kept
// off the sitemap. Thin tag pages are an SEO liability — Google flags
// them as low-value duplicates of /blog. Threshold is shared with
// app/sitemap.ts. Update both if you change it.
const TAG_INDEX_MIN_POSTS = 3;

interface SearchParams {
  page?: string;
}

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 1000);
}

function parseTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normaliseSlug(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 60);
}

async function findTag(slug: string) {
  return prisma.blogTag.findFirst({
    where: { slug, locale: "en" },
    select: { slug: true, displayName: true },
  });
}

async function countPostsForTag(slug: string): Promise<number> {
  return prisma.blogPost.count({
    where: {
      locale: "en",
      status: "published",
      publishedAt: { lte: new Date() },
      tagsJson: { contains: `"${slug}"` },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Tag pages are EN-only today (the post library is EN-only). When a
  // visitor lands on /ru/blog/tag/foo via the locale switcher, we emit
  // 404-like metadata so Google doesn't index a Russian URL whose body
  // is English. Phase C will re-emit per-locale once the post library
  // grows multilingual.
  const resolvedLocale = await getLocale();
  if (resolvedLocale !== DEFAULT_LOCALE) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  const cleanSlug = normaliseSlug(slug);
  const tag = await findTag(cleanSlug);
  if (!tag) {
    return { title: "Tag not found", robots: { index: false, follow: false } };
  }
  const postCount = await countPostsForTag(cleanSlug);
  const indexable = postCount >= TAG_INDEX_MIN_POSTS;

  const title = `${tag.displayName} — RentTools blog`;
  const description = `Posts tagged ${tag.displayName} on the RentTools blog.`;
  const base: Metadata = {
    title,
    description,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
    // follow:true even when noindex — we want Google to keep crawling
    // OUT to the linked posts; we just don't want this aggregator page
    // ranking on its own merit until it has substance.
    robots: indexable
      ? undefined
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/blog/tag/${tag.slug}`,
      siteName: "RentTools",
    },
    twitter: { card: "summary_large_image", title, description },
  };
  return applySeoOverrides(base, `/blog/tag/${tag.slug}`, "en");
}

export default async function BlogTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug: rawSlug } = await params;
  const sp = await searchParams;
  const slug = normaliseSlug(rawSlug);
  if (!slug) notFound();

  // Mirror the metadata gate: tag pages are EN-only until the post
  // library is multilingual.
  const resolvedLocale = await getLocale();
  if (resolvedLocale !== DEFAULT_LOCALE) notFound();

  const tag = await findTag(slug);
  if (!tag) notFound();

  const page = parsePage(sp.page);

  const where = {
    locale: "en",
    status: "published" as const,
    publishedAt: { lte: new Date() },
    tagsJson: { contains: `"${slug}"` },
  };

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        tagsJson: true,
        ogImageUrl: true,
        ogImageWidth: true,
        ogImageHeight: true,
        publishedAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const prevHref = page - 1 > 1 ? `/blog/tag/${slug}?page=${page - 1}` : `/blog/tag/${slug}`;
  const nextHref = `/blog/tag/${slug}?page=${page + 1}`;

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <MarketingHeader sticky />

      <main className="mx-auto max-w-[1180px] px-6">
        {/* Tag hero — same shape as the /blog index hero so the surface
            stays visually consistent across the section. The hero
            is intentionally smaller than the blog-index one because a
            tag landing is a sub-page, not the section root. */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--m-accent) 22%, transparent) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-4)]">Tag</p>
            <h1 className="mt-2 text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl md:text-[2.5rem]">
              {tag.displayName}
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-3)]">
              {total === 0
                ? "No posts yet under this tag."
                : `${total} ${total === 1 ? "post" : "posts"} on the RentTools blog tagged ${tag.displayName}.`}
            </p>
          </div>
        </section>

        <section className="mt-10">
          {posts.length === 0 ? (
            <p className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-4 py-12 text-center text-sm text-[var(--ink-3)]">
              Nothing here yet —{" "}
              <Link href="/blog" className="text-[var(--m-accent)] hover:underline">
                browse all posts
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => {
                const tags = parseTags(p.tagsJson);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-2)]/30 transition-all hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]/60 hover:shadow-lg"
                    >
                      <div className="aspect-[1.91/1] overflow-hidden bg-[var(--bg-3)]">
                        {p.ogImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.ogImageUrl}
                            alt={p.title}
                            width={p.ogImageWidth ?? undefined}
                            height={p.ogImageHeight ?? undefined}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="size-full"
                            style={{
                              background:
                                "radial-gradient(80% 80% at 50% 50%, color-mix(in oklab, var(--m-accent) 18%, transparent) 0%, transparent 70%)",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h2 className="text-balance text-[17px] font-semibold leading-snug tracking-tight text-[var(--ink)]">
                          {p.title}
                        </h2>
                        {p.excerpt && (
                          <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-[var(--ink-3)]">
                            {p.excerpt}
                          </p>
                        )}
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-[11px] text-[var(--ink-4)]">
                          {p.publishedAt && (
                            <time dateTime={p.publishedAt.toISOString()}>
                              {formatDate(p.publishedAt)}
                            </time>
                          )}
                          {tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[var(--line)] px-2 py-0.5 uppercase tracking-wider"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-between text-sm">
            {hasPrev ? (
              <Link
                href={prevHref}
                className="rounded-md border border-[var(--line)] bg-[var(--bg-2)]/40 px-4 py-2 text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                rel="prev"
              >
                ← Previous
              </Link>
            ) : (
              <span aria-hidden className="opacity-0">prev</span>
            )}
            <span className="text-[var(--ink-4)]">
              Page {page} of {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={nextHref}
                className="rounded-md border border-[var(--line)] bg-[var(--bg-2)]/40 px-4 py-2 text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                rel="next"
              >
                Next →
              </Link>
            ) : (
              <span aria-hidden className="opacity-0">next</span>
            )}
          </nav>
        )}
      </main>

      <footer className="mt-16 border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[var(--ink-4)] sm:flex-row">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <Link href="/blog" className="hover:text-[var(--ink)]">Blog</Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
