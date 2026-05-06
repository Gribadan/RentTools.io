import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { BlogComments, type BlogCommentItem } from "@/components/blog-comments";
import { BlogToc } from "@/components/blog-toc";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { extractToc, readingMinutes, renderMarkdown } from "@/lib/markdown";
import { getSession } from "@/lib/auth";
import { applySeoOverrides } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

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

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function findPublishedPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      locale: "en",
      status: "published",
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { username: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPublishedPost(slug);
  if (!post) {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }
  const url = `${SITE_URL}/blog/${slug}`;
  const base: Metadata = {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} · RentTools`,
      description: post.excerpt,
      url,
      siteName: "RentTools",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString() ?? post.publishedAt?.toISOString(),
      images: post.ogImageUrl ? [{ url: post.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} · RentTools`,
      description: post.excerpt,
      images: post.ogImageUrl ? [post.ogImageUrl] : undefined,
    },
  };
  return applySeoOverrides(base, `/blog/${slug}`, post.locale);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await findPublishedPost(slug);
  if (!post) notFound();

  const tags = parseTags(post.tagsJson);
  const html = renderMarkdown(post.body);
  const toc = extractToc(post.body);
  const minutes = readingMinutes(post.body);
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const blogPostingJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString() ?? post.publishedAt?.toISOString(),
    inLanguage: post.locale,
    keywords: tags.length > 0 ? tags.join(", ") : undefined,
    image: post.ogImageUrl || undefined,
    author: {
      "@type": "Person",
      name: post.author?.username ?? "RentTools",
    },
    publisher: {
      "@type": "Organization",
      name: "RentTools",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  const session = await getSession();
  const isSuperadmin = session?.role === "superadmin";

  // Related posts: same primary tag (first tag), newest first, exclude current.
  const primaryTag = tags[0];
  const related = primaryTag
    ? await prisma.blogPost.findMany({
        where: {
          locale: "en",
          status: "published",
          publishedAt: { lte: new Date() },
          id: { not: post.id },
          tagsJson: { contains: `"${primaryTag}"` },
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
        select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true },
      })
    : [];

  const commentRows = await prisma.blogComment.findMany({
    where: {
      postId: post.id,
      ...(isSuperadmin ? {} : { status: "visible" }),
    },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { username: true } } },
  });
  const comments: BlogCommentItem[] = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    status: c.status as BlogCommentItem["status"],
    createdAt: c.createdAt.toISOString(),
    username: c.user?.username ?? "deleted user",
  }));

  const authorInitial = (post.author?.username ?? "R").slice(0, 1).toUpperCase();

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <JsonLd data={blogPostingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] hover:text-white"
          >
            <span aria-hidden>←</span> Blog
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[var(--ink-3)]">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <Link href="/login" className="hover:text-[var(--ink)]">Sign in</Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* Hero — full-bleed gradient band, larger headline, key meta inline.
          Title scales aggressively on desktop so the post feels like a
          magazine feature rather than a wiki page. */}
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--bg)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--m-accent) 22%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[820px] px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
          {tags.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((t) => (
                <Link
                  key={t}
                  href={`/blog/tag/${encodeURIComponent(t)}`}
                  className="rounded-full border border-[var(--line)] bg-[var(--bg-2)]/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-3)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 text-pretty text-base leading-relaxed text-[var(--ink-3)] sm:text-lg sm:leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--ink-3)]">
            {post.author?.username && (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--m-accent)] to-[var(--m-accent-2)] text-[11px] font-semibold text-white">
                  {authorInitial}
                </span>
                <span className="text-[var(--ink-2)]">{post.author.username}</span>
              </span>
            )}
            {post.publishedAt && (
              <>
                <span aria-hidden className="text-[var(--ink-4)]">·</span>
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatLongDate(post.publishedAt)}
                </time>
              </>
            )}
            <span aria-hidden className="text-[var(--ink-4)]">·</span>
            <span>{minutes} min read</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
          <article className="min-w-0">
            {post.ogImageUrl && (
              // Hero image — only shown when the editor set an OG image. Sits
              // between hero and body so the eye lands on a visual after the
              // headline.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.ogImageUrl}
                alt=""
                className="mb-8 aspect-[1.91/1] w-full rounded-2xl border border-[var(--line)] object-cover"
                loading="eager"
              />
            )}

            <div
              className="prose-blog text-[17px] leading-[1.75] text-[var(--ink-2)]"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-6">
              <span className="text-xs uppercase tracking-wider text-[var(--ink-4)]">
                Share
              </span>
              <ShareLink
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                label="Twitter"
              />
              <ShareLink
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                label="LinkedIn"
              />
              <ShareLink
                href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`${post.excerpt}\n\n${postUrl}`)}`}
                label="Email"
              />
            </div>

            {related.length > 0 && (
              <section
                aria-labelledby="related-heading"
                className="mt-14 border-t border-[var(--line)] pt-10"
              >
                <h2
                  id="related-heading"
                  className="text-xl font-semibold tracking-tight text-[var(--ink)]"
                >
                  Keep reading
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/blog/${r.slug}`}
                        className="group block rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/30 p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]/60 hover:shadow-lg"
                      >
                        <h3 className="text-[15px] font-semibold leading-snug text-[var(--ink)] group-hover:text-white">
                          {r.title}
                        </h3>
                        {r.excerpt && (
                          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--ink-3)]">
                            {r.excerpt}
                          </p>
                        )}
                        {r.publishedAt && (
                          <time
                            dateTime={r.publishedAt.toISOString()}
                            className="mt-3 block text-[11px] uppercase tracking-wider text-[var(--ink-4)]"
                          >
                            {formatDate(r.publishedAt)}
                          </time>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <BlogComments
              postId={post.id}
              comments={comments}
              isSignedIn={!!session}
              isSuperadmin={isSuperadmin}
              loginHref={`/login?next=${encodeURIComponent(`/blog/${slug}`)}`}
            />

            <nav className="mt-12 border-t border-[var(--line)] pt-6 text-sm">
              <Link href="/blog" className="text-[var(--ink-3)] hover:text-[var(--ink)]">
                ← All posts
              </Link>
            </nav>
          </article>

          {/* TOC sidebar — only on lg+. Hidden when there are fewer than two
              headings; the BlogToc client guards that internally too. */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">
              <BlogToc entries={toc} />
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[var(--ink-4)] sm:flex-row sm:px-6">
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

function ShareLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-2)]/40 px-2.5 py-1 text-xs font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
    >
      {label}
    </a>
  );
}
