import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n/alternates";
import type { Locale } from "@/lib/i18n/translations";

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
  const resolvedLocale = await getLocale();
  const cleanSlug = normaliseSlug(slug);
  const tag = await findTag(cleanSlug);
  if (!tag) {
    return { title: "Tag not found", robots: { index: false, follow: false } };
  }
  const postCount = await countPostsForTag(cleanSlug);
  const indexable =
    postCount >= TAG_INDEX_MIN_POSTS && resolvedLocale === DEFAULT_LOCALE;

  // Tag pages are EN-only — the post library is EN-only, and even when a
  // post gets translated, the tag aggregator stays default-locale until
  // the locale's post library independently crosses the indexability
  // threshold. So canonical always points at the EN URL regardless of
  // the URL we're being rendered under (Stripe model). On non-default
  // locale URLs, noindex is hard-set to keep the duplicate out of SERPs.
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
  return applySeoOverrides(base, `/blog/tag/${tag.slug}`, DEFAULT_LOCALE);
}

// Per-locale banner shown above the tag-page hero on non-default-locale
// URLs. Tells the visitor the post library + tag taxonomy is English-
// only today. Same pattern as the untranslated-blog-post fallback.
const TAG_UNTRANSLATED_BANNER: Record<Locale, { line1: string; line2: string }> = {
  en: {
    line1: "Tag pages are English-only.",
    line2: "Post titles and bodies on the RentTools blog ship in English.",
  },
  ru: {
    line1: "Страницы по тегам пока только на английском.",
    line2: "Заголовки и тексты статей в блоге RentTools — на английском.",
  },
};

// Localised chrome (breadcrumb labels + nav-aria) for the tag page.
// Adding a third Locale to the union forces every key here to be filled
// in — TypeScript refuses to compile otherwise.
const TAG_CHROME: Record<Locale, { breadcrumbNav: string; homeLabel: string; blogLabel: string }> = {
  en: { breadcrumbNav: "Breadcrumb", homeLabel: "Home", blogLabel: "Blog" },
  ru: { breadcrumbNav: "Хлебные крошки", homeLabel: "Главная", blogLabel: "Блог" },
};

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

  // Stripe-model fallback: render EN content under any locale URL.
  // We don't redirect /<locale>/blog/tag/<slug> to /blog/tag/<slug>
  // — that would loop with the cookie-based middleware redirect that
  // sends /blog/tag/<slug> + rt-locale=ru back to /ru/blog/tag/<slug>.
  // Instead, render normally; metadata sets canonical→EN + noindex
  // when the URL prefix isn't default, so Google still consolidates.
  const resolvedLocale = await getLocale();
  const isUntranslated = resolvedLocale !== DEFAULT_LOCALE;
  const localeForLinks = resolvedLocale;

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
  // Pagination links keep the user on whatever locale URL they're
  // already viewing. Tag page is EN-only at the body level, but the
  // URL prefix is preserved so the user doesn't bounce out of their
  // locale just by clicking next.
  const prevHref = localePath(
    page - 1 > 1 ? `/blog/tag/${slug}?page=${page - 1}` : `/blog/tag/${slug}`,
    localeForLinks,
  );
  const nextHref = localePath(`/blog/tag/${slug}?page=${page + 1}`, localeForLinks);

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <MarketingHeader sticky />

      <main className="mx-auto max-w-[1180px] px-6">
        <Breadcrumbs
          className="pt-6 sm:pt-8"
          navLabel={TAG_CHROME[localeForLinks].breadcrumbNav}
          items={[
            {
              label: TAG_CHROME[localeForLinks].homeLabel,
              href: localePath("/", localeForLinks),
            },
            {
              label: TAG_CHROME[localeForLinks].blogLabel,
              href: localePath("/blog", localeForLinks),
            },
            { label: tag.displayName },
          ]}
        />
        {isUntranslated && (
          <div
            role="status"
            className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
            </svg>
            <div>
              <p className="font-medium text-[var(--ink)]">
                {TAG_UNTRANSLATED_BANNER[localeForLinks].line1}
              </p>
              <p className="mt-0.5 text-[var(--ink-3)]">
                {TAG_UNTRANSLATED_BANNER[localeForLinks].line2}
              </p>
            </div>
          </div>
        )}
        {/* Tag hero — same shape as the /blog index hero so the surface
            stays visually consistent across the section. The hero
            is intentionally smaller than the blog-index one because a
            tag landing is a sub-page, not the section root. */}
        <section className="relative mt-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
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
              <Link href={localePath("/blog", localeForLinks)} className="text-[var(--m-accent)] hover:underline">
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
                      href={localePath(`/blog/${p.slug}`, localeForLinks)}
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
            <Link href={localePath("/", localeForLinks)} className="hover:text-[var(--ink)]">Home</Link>
            <Link href={localePath("/blog", localeForLinks)} className="hover:text-[var(--ink)]">Blog</Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
