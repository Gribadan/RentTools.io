import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogComments, type BlogCommentItem } from "@/components/blog-comments";
import { BlogCopyLink } from "@/components/blog-copy-link";
import { BlogFaq } from "@/components/blog-faq";
import { MarketingHeader } from "@/components/marketing-header";
import { BlogTldr } from "@/components/blog-tldr";
import { BlogToc } from "@/components/blog-toc";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { extractToc, readingMinutes, renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import { getSession } from "@/lib/auth";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/alternates";
import type { Locale } from "@/lib/i18n/translations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

// Build per-post hreflang siblings. Posts are stored per-locale (a row
// per (slug, locale) pair). Pointing hreflang at a URL whose row doesn't
// exist makes Google chase 404s, so this returns only the locales that
// actually have a published row for this slug.
function buildPostLanguagesForSlug(
  slug: string,
  availableLocales: Set<string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    if (!availableLocales.has(loc)) continue;
    if (loc === DEFAULT_LOCALE) {
      result[loc] = `/blog/${slug}`;
    } else {
      result[loc] = `/${loc}/blog/${slug}`;
    }
  }
  return result;
}

function parseTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

interface FaqEntry {
  q: string;
  a: string;
}

function parseFaq(json: string): FaqEntry[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is FaqEntry => typeof x === "object" && x !== null && typeof (x as { q?: unknown }).q === "string" && typeof (x as { a?: unknown }).a === "string");
  } catch {
    return [];
  }
}

function countWords(md: string): number {
  return md.replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function findPublishedPost(slug: string, locale: Locale) {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      locale,
      status: "published",
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { username: true } },
    },
  });
}

// All locales that have a published row for this slug. Used to build
// per-post hreflang siblings without pointing at 404s.
async function findPostLocales(slug: string): Promise<Set<string>> {
  const rows = await prisma.blogPost.findMany({
    where: {
      slug,
      status: "published",
      publishedAt: { lte: new Date() },
    },
    select: { locale: true },
  });
  return new Set(rows.map((r) => r.locale));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await findPublishedPost(slug, locale);
  if (!post) {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }
  const availableLocales = await findPostLocales(slug);
  const languages = buildPostLanguagesForSlug(slug, availableLocales);
  const canonical =
    locale === DEFAULT_LOCALE ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
  const url = `${SITE_URL}${canonical}`;
  const tags = parseTags(post.tagsJson);
  const ogImage = post.ogImageUrl
    ? {
        url: post.ogImageUrl,
        ...(post.ogImageWidth ? { width: post.ogImageWidth } : {}),
        ...(post.ogImageHeight ? { height: post.ogImageHeight } : {}),
      }
    : null;
  const base: Metadata = {
    title: post.title,
    description: post.excerpt,
    keywords: tags,
    alternates: { canonical, languages },
    authors: post.author?.username ? [{ name: post.author.username }] : undefined,
    openGraph: {
      type: "article",
      title: `${post.title} · RentTools`,
      description: post.excerpt,
      url,
      siteName: "RentTools",
      locale: post.locale === "ru" ? "ru_RU" : "en_US",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString() ?? post.publishedAt?.toISOString(),
      authors: post.author?.username ? [post.author.username] : undefined,
      tags,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} · RentTools`,
      description: post.excerpt,
      images: ogImage ? [ogImage.url] : undefined,
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
  // Look up by resolved locale so /ru/blog/<slug> 404s when no Russian
  // translation exists rather than rendering the EN body under an RU
  // URL (which Google would consolidate as duplicate content).
  const resolvedLocale = await getLocale();
  const post = await findPublishedPost(slug, resolvedLocale);
  if (!post) notFound();

  const tags = parseTags(post.tagsJson);
  const faq = parseFaq(post.faqJson);
  // Strip a leading `# Title` from the body — the page already renders the
  // post title as <h1> in the hero, so a body H1 would duplicate it and
  // break the h1→h2→h3 outline. Render + TOC both work off the cleaned body
  // so the slugs they produce stay in sync.
  const cleanedBody = stripLeadingH1(post.body);
  const html = renderMarkdown(cleanedBody);
  const toc = extractToc(cleanedBody);
  const minutes = readingMinutes(cleanedBody);
  const wordCount = countWords(cleanedBody);
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const articleSection = tags[0] ?? "Hosting";
  const imageNode = post.ogImageUrl
    ? {
        "@type": "ImageObject",
        url: post.ogImageUrl,
        ...(post.ogImageWidth ? { width: post.ogImageWidth } : {}),
        ...(post.ogImageHeight ? { height: post.ogImageHeight } : {}),
      }
    : undefined;

  const session = await getSession();
  const locale = resolvedLocale;
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

  // Visible-only comment rows for both the public render AND the JSON-LD
  // (we don't want hidden / soft-deleted rows leaking into search). Super-
  // admin still sees the moderation list inline.
  const visibleCommentRows = await prisma.blogComment.findMany({
    where: { postId: post.id, status: "visible" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { username: true } } },
  });
  const commentRows = isSuperadmin
    ? await prisma.blogComment.findMany({
        where: { postId: post.id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true } } },
      })
    : visibleCommentRows;
  const comments: BlogCommentItem[] = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    status: c.status as BlogCommentItem["status"],
    createdAt: c.createdAt.toISOString(),
    username: c.user?.username ?? "deleted user",
  }));

  const authorInitial = (post.author?.username ?? "R").slice(0, 1).toUpperCase();

  // Article schema — enriched with image dimensions, articleSection,
  // wordCount, structured comment[] (Schema.org Comment) and a comment
  // count. Google uses these signals when ranking long-form content for
  // E-E-A-T — especially the modified date + author identity.
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
    articleSection,
    wordCount,
    timeRequired: `PT${minutes}M`,
    image: imageNode,
    author: {
      "@type": "Person",
      name: post.author?.username ?? "RentTools",
      url: `${SITE_URL}/blog`,
    },
    publisher: {
      "@type": "Organization",
      name: "RentTools",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    commentCount: visibleCommentRows.length,
    comment: visibleCommentRows.length > 0
      ? visibleCommentRows.map((c) => ({
          "@type": "Comment",
          text: c.body,
          dateCreated: c.createdAt.toISOString(),
          author: {
            "@type": "Person",
            name: c.user?.username ?? "deleted user",
          },
        }))
      : undefined,
  };

  // Separate FAQPage schema. Google's docs require it as its own block
  // (not nested inside Article) for the FAQ rich-result eligibility.
  const faqJsonLd = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <JsonLd data={blogPostingJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <MarketingHeader sticky />

      {/* Single outer container shared by the hero, the article, and the TOC
          sidebar. The two-column grid inside lets the hero + article live
          in the same column (the right TOC sidebar floats alongside them on
          lg+), so the hero is always exactly as wide as the prose. */}
      <main className="mx-auto max-w-[1180px] px-6">
        <div className="grid gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
          <article className="min-w-0">
            <header className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-6 pb-8 pt-9 sm:px-10 sm:pb-10 sm:pt-12">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--m-accent) 22%, transparent) 0%, transparent 70%)",
                }}
              />
              <div className="relative">
                {tags.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {tags.slice(0, 4).map((t) => (
                      <Link
                        key={t}
                        href={`/blog/tag/${encodeURIComponent(t)}`}
                        className="rounded-full border border-[var(--line)] bg-[var(--bg)]/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-3)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                )}
                <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl md:text-[2.75rem] lg:text-[3rem]">
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
                  <span>
                    {locale === "ru" ? `${minutes} мин чтения` : `${minutes} min read`}
                  </span>
                </div>
              </div>
            </header>

            {post.ogImageUrl && (
              // Cover image — only shown when the editor set an OG image.
              // Sits between hero and body so the eye lands on a visual
              // after the headline. width/height come from the upload API
              // so the browser can reserve layout space pre-load (no CLS).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.ogImageUrl}
                alt={post.title}
                width={post.ogImageWidth ?? undefined}
                height={post.ogImageHeight ?? undefined}
                className="mb-10 aspect-[1.91/1] w-full rounded-2xl border border-[var(--line)] object-cover"
                loading="eager"
                fetchPriority="high"
              />
            )}

            <BlogTldr tldr={post.tldr} />

            <div
              className="prose-blog text-[17px] leading-[1.75] text-[var(--ink-2)]"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <BlogFaq items={faq} />

            <BlogShareRow url={postUrl} title={post.title} excerpt={post.excerpt} locale={locale} />

            {related.length > 0 && (
              <section
                aria-labelledby="related-heading"
                className="mt-14 border-t border-[var(--line)] pt-10"
              >
                <h2
                  id="related-heading"
                  className="text-xl font-semibold tracking-tight text-[var(--ink)]"
                >
                  {locale === "ru" ? "Читать дальше" : "Keep reading"}
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/blog/${r.slug}`}
                        className="group block rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/30 p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[var(--bg-2)]/60 hover:shadow-lg"
                      >
                        <h3 className="text-[15px] font-semibold leading-snug text-[var(--ink)]">
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
                {locale === "ru" ? "← Все статьи" : "← All posts"}
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
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[var(--ink-4)] sm:flex-row">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[var(--ink)]">
              {locale === "ru" ? "Главная" : "Home"}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">
              {locale === "ru" ? "Конфиденциальность" : "Privacy"}
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">
              {locale === "ru" ? "Условия" : "Terms"}
            </Link>
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

// Server-rendered share row + the client-only copy-link button. Splitting
// them keeps the heavy server tree out of a client bundle while still
// giving the reader a one-tap copy affordance.
function BlogShareRow({
  url,
  title,
  excerpt,
  locale,
}: {
  url: string;
  title: string;
  excerpt: string;
  locale: "en" | "ru";
}) {
  // Brand names (X, LinkedIn, etc.) stay un-translated — they're proper
  // nouns and the share buttons send to the same domains regardless of
  // visitor locale. Only "Share" + "Email" need a Russian variant.
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-6">
      <span className="text-xs uppercase tracking-wider text-[var(--ink-4)]">
        {locale === "ru" ? "Поделиться" : "Share"}
      </span>
      <ShareLink
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        label="X / Twitter"
      />
      <ShareLink
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        label="LinkedIn"
      />
      <ShareLink
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        label="Facebook"
      />
      <ShareLink
        href={`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
        label="Reddit"
      />
      <ShareLink
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${excerpt}\n\n${url}`)}`}
        label={locale === "ru" ? "Почта" : "Email"}
      />
      <BlogCopyLink url={url} />
    </div>
  );
}
