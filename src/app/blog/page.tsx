import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { localizedAlternates, localePath } from "@/lib/i18n/alternates";
import type { Locale } from "@/lib/i18n/translations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

const PAGE_SIZE = 12;

const BLOG_INDEX_COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Blog",
    description:
      "Practical guides on calendar sync, double-booking prevention, cleaning automation, and GDPR for short-term rental hosts.",
  },
  ru: {
    title: "Блог",
    description:
      "Практические руководства для хостов: синхронизация календарей, предотвращение двойных бронирований, автоматизация уборок и GDPR.",
  },
};

interface CopyShape {
  ogLocale: string;
  breadcrumbNav: string;
  homeLabel: string;
  homeHref: string;
  blogLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  tagFilterNav: string;
  tagAll: string;
  emptyNoTag: string;
  emptyWithTag: (tag: string) => string;
  featuredBadge: string;
  paginationPrev: string;
  paginationLabel: (page: number, total: number) => string;
  paginationNext: string;
  footerHome: string;
  footerPrivacy: string;
  footerTerms: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    ogLocale: "en_US",
    breadcrumbNav: "Breadcrumb",
    homeLabel: "Home",
    homeHref: "/",
    blogLabel: "Blog",
    heroEyebrow: "The RentTools blog",
    heroTitle: "Field notes for short-term rental hosts",
    heroIntro:
      "Calendar sync that actually works, cleaning automation that doesn't double-book the cleaner, and a host's GDPR checklist that fits on one page. Written by people who run listings, not affiliate sites.",
    tagFilterNav: "Filter by tag",
    tagAll: "All",
    emptyNoTag: "No posts yet.",
    emptyWithTag: (tag) => `No posts yet for tag "${tag}".`,
    featuredBadge: "Featured",
    paginationPrev: "← Previous",
    paginationLabel: (page, total) => `Page ${page} of ${total}`,
    paginationNext: "Next →",
    footerHome: "Home",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
  },
  ru: {
    ogLocale: "ru_RU",
    breadcrumbNav: "Хлебные крошки",
    homeLabel: "Главная",
    homeHref: "/ru",
    blogLabel: "Блог",
    heroEyebrow: "Блог RentTools",
    heroTitle: "Полевые заметки для хостов краткосрочной аренды",
    heroIntro:
      "Синхронизация календарей, которая правда работает, автоматизация уборок без двойных назначений и чек-лист GDPR на одну страницу. Писали те, кто сами сдают, а не те, кто пишет для трафика.",
    tagFilterNav: "Фильтр по тегам",
    tagAll: "Все",
    emptyNoTag: "Пока нет статей.",
    emptyWithTag: (tag) => `Пока нет статей по тегу "${tag}".`,
    featuredBadge: "Главное",
    paginationPrev: "← Назад",
    paginationLabel: (page, total) => `Страница ${page} из ${total}`,
    paginationNext: "Дальше →",
    footerHome: "Главная",
    footerPrivacy: "Конфиденциальность",
    footerTerms: "Условия",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = BLOG_INDEX_COPY[locale];
  const alts = localizedAlternates("/blog", locale);
  const base: Metadata = {
    title: copy.title,
    description: copy.description,
    alternates: alts,
    openGraph: {
      type: "website",
      title: `${copy.title} · RentTools`,
      description: copy.description,
      url: alts.canonical,
      siteName: "RentTools",
      locale: COPY[locale].ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} · RentTools`,
      description: copy.description,
    },
  };
  return applySeoOverrides(base, "/blog", locale);
}

interface SearchParams {
  page?: string;
  tag?: string;
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

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = COPY[locale];
  const page = parsePage(sp.page);
  const tagFilter = (sp.tag ?? "").trim().toLowerCase().slice(0, 60) || undefined;

  // tagsJson is a JSON array of slug strings, e.g. ["airbnb","ical-sync"].
  // SQLite `contains` on the JSON-encoded string is good enough for the
  // expected post volume (<200 posts in a few years). We bracket the slug
  // with quotes so "host" doesn't match "host-tips".
  const where = {
    locale: "en",
    status: "published" as const,
    publishedAt: { lte: new Date() },
    ...(tagFilter ? { tagsJson: { contains: `"${tagFilter}"` } } : {}),
  };

  const [total, posts, tagRows] = await Promise.all([
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
    prisma.blogTag.findMany({
      where: { locale: "en" },
      orderBy: { displayName: "asc" },
      select: { slug: true, displayName: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const prevHref = localePath(buildHref({ page: page - 1, tag: tagFilter }), locale);
  const nextHref = localePath(buildHref({ page: page + 1, tag: tagFilter }), locale);

  // Featured = newest post on page 1 with no tag filter — gets a wider
  // hero card. Everything else flows in the magazine grid below it.
  const isLanding = page === 1 && !tagFilter;
  const featured = isLanding && posts.length > 0 ? posts[0] : null;
  const rest = featured ? posts.slice(1) : posts;

  // Blog JSON-LD — describes /blog as a Blog, with each visible post
  // shown as a BlogPosting stub. Distinct from per-post BlogPosting
  // emitted on /blog/[slug] (those are the canonical entity for a
  // given article); this shows Google "/blog is the section index".
  // Only emit on the un-filtered landing so we don't repeat the same
  // schema on every paginated page.
  const blogJsonLd = isLanding
    ? {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${SITE_URL}/blog#blog`,
        url: `${SITE_URL}/blog`,
        name: "RentTools blog",
        description:
          "Field notes for short-term rental hosts: calendar sync, cleaning automation, GDPR, and the boring parts of running a listing.",
        publisher: { "@id": `${SITE_URL}/#organization` },
        blogPost: posts.slice(0, 10).map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          description: p.excerpt,
          url: `${SITE_URL}/blog/${p.slug}`,
          datePublished: p.publishedAt?.toISOString(),
          image: p.ogImageUrl ?? undefined,
        })),
      }
    : null;

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {blogJsonLd && <JsonLd data={blogJsonLd} />}
      <MarketingHeader sticky />

      <main className="mx-auto max-w-[1180px] px-6">
        <Breadcrumbs
          className="pt-6 sm:pt-8"
          navLabel={t.breadcrumbNav}
          items={[
            {
              label: t.homeLabel,
              href: t.homeHref,
            },
            { label: t.blogLabel },
          ]}
        />
        {/* Index hero — same accent gradient as the post pages so the
            shell reads as one product. Headline + intro pitch the section
            in copy that has actual keywords (Google reads this for the
            blog hub's own ranking). */}
        <section className="relative mt-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-6 pb-10 pt-10 sm:px-10 sm:pb-12 sm:pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--m-accent) 22%, transparent) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="mono mb-4 inline-block rounded-full bg-[var(--bg-2)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
              {t.heroEyebrow}
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl md:text-[2.75rem]">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-[var(--ink-3)] sm:text-lg">
              {t.heroIntro}
            </p>
          </div>
        </section>

        {/* Untranslated-content banner: shown on every non-default-locale
            blog index because post titles + bodies still come from EN
            rows in the DB. As soon as a post gets a translated row, the
            post page itself silently swaps to native rendering — but the
            index continues to mix both until the library is fully
            translated, so the banner stays. Keep it prominent: visitors
            who don't read English need to know before they click. */}
        {locale === "ru" && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm"
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
                Статьи пока только на английском.
              </p>
              <p className="mt-0.5 text-[var(--ink-3)]">
                Перевод в процессе — заголовки и тексты статей ниже на английском, навигация на русском.
              </p>
            </div>
          </div>
        )}

        {tagRows.length > 0 && (
          <nav
            aria-label={t.tagFilterNav}
            className="mt-8 flex flex-wrap gap-2 text-xs"
          >
            <Link
              href={localePath("/blog", locale)}
              className={`rounded-full border px-3 py-1 transition-colors ${
                tagFilter
                  ? "border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                  : "border-[var(--m-accent)] text-[var(--m-accent)]"
              }`}
            >
              {t.tagAll}
            </Link>
            {tagRows.map((t) => {
              const active = tagFilter === t.slug;
              // Tag pages stay default-locale; localePath() returns the
              // unprefixed URL because /blog/tag is gated to EN-only via
              // the middleware redirect. Once tag pages go multilingual,
              // adding /blog/tag to LOCALIZABLE_PATHS auto-prefixes here.
              return (
                <Link
                  key={t.slug}
                  href={localePath(`/blog/tag/${encodeURIComponent(t.slug)}`, locale)}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    active
                      ? "border-[var(--m-accent)] text-[var(--m-accent)]"
                      : "border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t.displayName}
                </Link>
              );
            })}
          </nav>
        )}

        <section className="mt-10 sm:mt-12">
          {posts.length === 0 ? (
            <p className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-4 py-12 text-center text-sm text-[var(--ink-3)]">
              {tagFilter ? t.emptyWithTag(tagFilter) : t.emptyNoTag}
            </p>
          ) : (
            <>
              {featured && (
                <Link
                  href={localePath(`/blog/${featured.slug}`, locale)}
                  className="group mb-10 grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-2)]/30 transition-all hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]/60 hover:shadow-xl md:grid-cols-2"
                >
                  <div className="aspect-[1.91/1] overflow-hidden bg-[var(--bg-3)] md:aspect-auto md:h-full">
                    {featured.ogImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.ogImageUrl}
                        alt={featured.title}
                        width={featured.ogImageWidth ?? undefined}
                        height={featured.ogImageHeight ?? undefined}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="eager"
                        fetchPriority="high"
                      />
                    ) : (
                      <FeaturedPlaceholder />
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[var(--m-accent)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      {t.featuredBadge}
                    </span>
                    <h2 className="text-balance text-2xl font-bold leading-snug tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-[var(--ink-3)]">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-4)]">
                      {featured.publishedAt && (
                        <time dateTime={featured.publishedAt.toISOString()}>
                          {formatDate(featured.publishedAt)}
                        </time>
                      )}
                      {parseTags(featured.tagsJson).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wider"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              )}

              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => {
                  const tags = parseTags(p.tagsJson);
                  return (
                    <li key={p.id}>
                      <Link
                        href={localePath(`/blog/${p.slug}`, locale)}
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
                            <FeaturedPlaceholder small />
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
                          <div className="mt-auto pt-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-4)]">
                            {p.publishedAt && (
                              <time dateTime={p.publishedAt.toISOString()}>
                                {formatDate(p.publishedAt)}
                              </time>
                            )}
                            {tags.slice(0, 2).map((t) => (
                              <span key={t} className="rounded-full border border-[var(--line)] px-2 py-0.5 uppercase tracking-wider">
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
            </>
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
                {t.paginationPrev}
              </Link>
            ) : (
              <span aria-hidden className="opacity-0">prev</span>
            )}
            <span className="text-[var(--ink-4)]">
              {t.paginationLabel(page, totalPages)}
            </span>
            {hasNext ? (
              <Link
                href={nextHref}
                className="rounded-md border border-[var(--line)] bg-[var(--bg-2)]/40 px-4 py-2 text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                rel="next"
              >
                {t.paginationNext}
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
            <Link href={localePath("/", locale)} className="hover:text-[var(--ink)]">
              {t.footerHome}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">
              {t.footerPrivacy}
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">
              {t.footerTerms}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeaturedPlaceholder({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`flex size-full items-center justify-center text-[var(--m-accent)] opacity-30 ${small ? "" : ""}`}
      aria-hidden
      style={{
        background:
          "radial-gradient(80% 80% at 50% 50%, color-mix(in oklab, var(--m-accent) 18%, transparent) 0%, transparent 70%)",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.2}>
        <path d="M3.4 11.6 L12 4.5 L20.6 11.6 L19 11.6 L19 19.5 L5 19.5 L5 11.6 Z" />
        <rect x="15.6" y="6.2" width="1.7" height="3.4" rx="0.2" />
      </svg>
    </div>
  );
}

function buildHref(opts: { page: number; tag: string | undefined }): string {
  const params: string[] = [];
  if (opts.page > 1) params.push(`page=${opts.page}`);
  if (opts.tag) params.push(`tag=${encodeURIComponent(opts.tag)}`);
  return params.length === 0 ? "/blog" : `/blog?${params.join("&")}`;
}
