import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { BlogComments, type BlogCommentItem } from "@/components/blog-comments";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { getSession } from "@/lib/auth";

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
  return {
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <JsonLd data={blogPostingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/blog" className="text-sm font-semibold text-[#e8e8ec] hover:text-white">
            ← Blog
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#a0a0a8]">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/login" className="hover:text-[#e8e8ec]">Sign in</Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#71717a]">
              {post.publishedAt && (
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
              )}
              {post.author?.username && (
                <span>by {post.author.username}</span>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Link
                      key={t}
                      href={`/blog?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-[#1e2329] px-2 py-0.5 text-[11px] hover:border-[#2a313b] hover:text-[#a0a0a8]"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {post.excerpt && (
              <p className="mt-5 text-base leading-relaxed text-[#a0a0a8]">{post.excerpt}</p>
            )}
          </header>

          <div
            className="prose-blog text-sm leading-relaxed text-[#d4d4d8] sm:text-base"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <BlogComments
          postId={post.id}
          comments={comments}
          isSignedIn={!!session}
          isSuperadmin={isSuperadmin}
          loginHref={`/login?next=${encodeURIComponent(`/blog/${slug}`)}`}
        />

        <nav className="mt-12 border-t border-[#1e2329] pt-6 text-sm">
          <Link href="/blog" className="text-[#a0a0a8] hover:text-[#e8e8ec]">
            ← All posts
          </Link>
        </nav>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/privacy" className="hover:text-[#e8e8ec]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#e8e8ec]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
