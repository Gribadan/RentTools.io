import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = normaliseSlug(slug);
  const tag = await findTag(cleanSlug);
  if (!tag) {
    return { title: "Tag not found", robots: { index: false, follow: false } };
  }
  const title = `${tag.displayName} — RentTools blog`;
  const description = `Posts tagged ${tag.displayName} on the RentTools blog.`;
  return {
    title,
    description,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/blog/tag/${tag.slug}`,
      siteName: "RentTools",
    },
    twitter: { card: "summary_large_image", title, description },
  };
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
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/blog" className="text-sm font-semibold text-[#e8e8ec] hover:text-white">
            ← Blog
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#a0a0a8]">
            <Link href="/login" className="hover:text-[#e8e8ec]">Sign in</Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs uppercase tracking-wide text-[#71717a]">Tag</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{tag.displayName}</h1>
        <p className="mt-2 text-sm text-[#a0a0a8]">
          {total === 0
            ? "No posts yet under this tag."
            : `${total} ${total === 1 ? "post" : "posts"} under this tag.`}
        </p>

        <section className="mt-8">
          {posts.length === 0 ? (
            <p className="rounded-lg border border-[#1e2329] bg-[#0f1419] px-4 py-8 text-center text-sm text-[#a0a0a8]">
              Nothing here yet — <Link href="/blog" className="text-[#ff385c] hover:underline">browse all posts</Link>.
            </p>
          ) : (
            <ul className="space-y-4">
              {posts.map((p) => {
                const tags = parseTags(p.tagsJson);
                return (
                  <li
                    key={p.id}
                    className="rounded-lg border border-[#1e2329] bg-[#0f1419] p-5 transition-colors hover:border-[#2a313b]"
                  >
                    <Link href={`/blog/${p.slug}`} className="block">
                      <h2 className="text-xl font-semibold text-[#e8e8ec] hover:text-white sm:text-2xl">
                        {p.title}
                      </h2>
                      {p.excerpt && (
                        <p className="mt-2 text-sm text-[#a0a0a8] sm:text-base">{p.excerpt}</p>
                      )}
                    </Link>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#71717a]">
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
                              className="rounded-full border border-[#1e2329] px-2 py-0.5 text-[11px] hover:border-[#2a313b] hover:text-[#a0a0a8]"
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
                className="rounded-md border border-[#1e2329] bg-[#0f1419] px-4 py-2 text-[#a0a0a8] hover:border-[#2a313b] hover:text-[#e8e8ec]"
                rel="prev"
              >
                ← Previous
              </Link>
            ) : (
              <span aria-hidden className="opacity-0">prev</span>
            )}
            <span className="text-[#71717a]">
              Page {page} of {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={nextHref}
                className="rounded-md border border-[#1e2329] bg-[#0f1419] px-4 py-2 text-[#a0a0a8] hover:border-[#2a313b] hover:text-[#e8e8ec]"
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

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/blog" className="hover:text-[#e8e8ec]">Blog</Link>
            <Link href="/privacy" className="hover:text-[#e8e8ec]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#e8e8ec]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
