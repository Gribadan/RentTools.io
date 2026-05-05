import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BlogPostEditor, type EditorPost } from "@/components/blog-post-editor";

export const metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogPostPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin") notFound();

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const row = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  });
  if (!row) notFound();

  let translationSibling: EditorPost["translationSibling"] = null;
  if (row.translationGroupId !== null) {
    const sib = await prisma.blogPost.findFirst({
      where: { translationGroupId: row.translationGroupId, id: { not: row.id } },
      select: { id: true, slug: true, locale: true, title: true, status: true },
    });
    translationSibling = sib;
  }

  // Candidates for the translation pair selector: opposite-locale posts
  // not already linked to a different group. Limit to 200 most-recent for
  // the dropdown — the editor surfaces a free-form id input as a fallback
  // when the desired post is older.
  const oppositeLocale = row.locale === "en" ? "ru" : "en";
  const candidates = await prisma.blogPost.findMany({
    where: {
      locale: oppositeLocale,
      OR: [
        { translationGroupId: null },
        { translationGroupId: row.translationGroupId ?? -1 },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, slug: true, locale: true, title: true, status: true },
  });

  const post: EditorPost = {
    id: row.id,
    slug: row.slug,
    locale: row.locale as "en" | "ru",
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status as "draft" | "published" | "archived",
    authorId: row.authorId,
    authorUsername: row.author?.username ?? null,
    tags: parseTags(row.tagsJson),
    ogImageUrl: row.ogImageUrl,
    translationGroupId: row.translationGroupId,
    translationSibling,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
    commentCount: row._count.comments,
  };

  return (
    <BlogPostEditor
      post={post}
      candidates={candidates}
      currentUser={{ username: session.username }}
    />
  );
}

function parseTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}
