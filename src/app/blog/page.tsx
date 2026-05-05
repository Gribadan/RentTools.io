import type { Metadata } from "next";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { prisma } from "@/lib/prisma";
import { applySeoOverrides } from "@/lib/seo";

const PAGE_SIZE = 12;
const TITLE = "Blog";
const DESCRIPTION =
  "Practical guides on calendar sync, double-booking prevention, cleaning automation, and GDPR for short-term rental hosts.";

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/blog" },
    openGraph: {
      type: "website",
      title: `${TITLE} · RentTools`,
      description: DESCRIPTION,
      url: "/blog",
      siteName: "RentTools",
    },
    twitter: {
      card: "summary_large_image",
      title: `${TITLE} · RentTools`,
      description: DESCRIPTION,
    },
  };
  return applySeoOverrides(base, "/blog", "en");
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
  const prevHref = buildHref({ page: page - 1, tag: tagFilter });
  const nextHref = buildHref({ page: page + 1, tag: tagFilter });

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[var(--ink)] hover:text-white">
            ← RentTools
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[var(--ink-3)]">
            <Link href="/login" className="hover:text-[var(--ink)]">Sign in</Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-3)] sm:text-base">
          Notes from running short-term rentals — calendar sync, cleaning workflows,
          guest data, and the boring parts of GDPR a host actually has to do.
        </p>

        {tagRows.length > 0 && (
          <nav className="mt-6 flex flex-wrap gap-2 text-xs">
            <Link
              href="/blog"
              className={`rounded-full border px-3 py-1 ${
                tagFilter
                  ? "border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                  : "border-[var(--m-accent)] text-[var(--m-accent)]"
              }`}
            >
              All
            </Link>
            {tagRows.map((t) => {
              const active = tagFilter === t.slug;
              return (
                <Link
                  key={t.slug}
                  href={`/blog/tag/${encodeURIComponent(t.slug)}`}
                  className={`rounded-full border px-3 py-1 ${
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

        <section className="mt-8">
          {posts.length === 0 ? (
            <p className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-8 text-center text-sm text-[var(--ink-3)]">
              No posts yet{tagFilter ? ` for tag "${tagFilter}"` : ""}.
            </p>
          ) : (
            <ul className="space-y-4">
              {posts.map((p) => {
                const tags = parseTags(p.tagsJson);
                return (
                  <li
                    key={p.id}
                    className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-5 transition-colors hover:border-[var(--line-2)]"
                  >
                    <Link href={`/blog/${p.slug}`} className="block">
                      <h2 className="text-xl font-semibold text-[var(--ink)] hover:text-white sm:text-2xl">
                        {p.title}
                      </h2>
                      {p.excerpt && (
                        <p className="mt-2 text-sm text-[var(--ink-3)] sm:text-base">{p.excerpt}</p>
                      )}
                    </Link>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-4)]">
                      {p.publishedAt && (
                        <time dateTime={p.publishedAt.toISOString()}>
                          {formatDate(p.publishedAt)}
                        </time>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((t) => (
                            <Link
                              key={t}
                              href={`/blog/tag/${encodeURIComponent(t)}`}
                              className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] hover:border-[var(--line-2)] hover:text-[var(--ink-3)]"
                            >
                              {t}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-between text-sm">
            {hasPrev ? (
              <Link
                href={prevHref}
                className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
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
                className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
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

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[var(--ink-4)] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function buildHref(opts: { page: number; tag: string | undefined }): string {
  const params: string[] = [];
  if (opts.page > 1) params.push(`page=${opts.page}`);
  if (opts.tag) params.push(`tag=${encodeURIComponent(opts.tag)}`);
  return params.length === 0 ? "/blog" : `/blog?${params.join("&")}`;
}
