"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renderMarkdown } from "@/lib/markdown";

export interface EditorTranslationCandidate {
  id: number;
  slug: string;
  locale: string;
  title: string;
  status: string;
}

export interface EditorPost {
  id: number;
  slug: string;
  locale: "en" | "ru";
  title: string;
  excerpt: string;
  body: string;
  status: "draft" | "published" | "archived";
  authorId: number;
  authorUsername: string | null;
  tags: string[];
  ogImageUrl: string | null;
  translationGroupId: number | null;
  translationSibling: EditorTranslationCandidate | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
}

interface Props {
  post: EditorPost;
  candidates: EditorTranslationCandidate[];
  currentUser: { username: string };
}

const TITLE_MAX = 200;
const SLUG_MAX = 80;
const EXCERPT_MAX = 320;
const OG_URL_MAX = 512;

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function BlogPostEditor({ post, candidates }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [locale, setLocale] = useState<"en" | "ru">(post.locale);
  const [status, setStatus] = useState<"draft" | "published" | "archived">(post.status);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [body, setBody] = useState(post.body);
  const [tagsInput, setTagsInput] = useState(post.tags.join(", "));
  const [ogImageUrl, setOgImageUrl] = useState(post.ogImageUrl ?? "");
  const [publishedAtLocal, setPublishedAtLocal] = useState(toLocalDateTimeInput(post.publishedAt));
  const [translationSibling, setTranslationSibling] = useState(post.translationSibling);
  const [linkOtherId, setLinkOtherId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0),
    [tagsInput],
  );

  const previewHtml = useMemo(() => renderMarkdown(body), [body]);
  const wordCount = useMemo(
    () => body.trim().split(/\s+/).filter(Boolean).length,
    [body],
  );

  const dirty =
    title !== post.title ||
    slug !== post.slug ||
    locale !== post.locale ||
    status !== post.status ||
    excerpt !== post.excerpt ||
    body !== post.body ||
    JSON.stringify(tags) !== JSON.stringify(post.tags) ||
    (ogImageUrl.trim() || null) !== (post.ogImageUrl ?? null) ||
    fromLocalDateTimeInput(publishedAtLocal) !== post.publishedAt;

  const setStatusMessage = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          locale,
          status,
          excerpt,
          body,
          tags,
          ogImageUrl: ogImageUrl.trim().length > 0 ? ogImageUrl.trim() : null,
          publishedAt: fromLocalDateTimeInput(publishedAtLocal),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusMessage(data.error ?? "Failed to save", false);
        return;
      }
      setStatusMessage("Saved.", true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const linkTranslation = async (otherId: number) => {
    setLinkBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}/translation-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherPostId: otherId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusMessage(data.error ?? "Failed to link", false);
        return;
      }
      const sib = candidates.find((c) => c.id === otherId) ?? null;
      setTranslationSibling(sib);
      setLinkOtherId("");
      setStatusMessage("Linked.", true);
      router.refresh();
    } finally {
      setLinkBusy(false);
    }
  };

  const unlinkTranslation = async () => {
    if (!confirm("Unlink this post from its translation? The other post stays in the same group.")) return;
    setLinkBusy(true);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}/translation-link`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusMessage(data.error ?? "Failed to unlink", false);
        return;
      }
      setTranslationSibling(null);
      setStatusMessage("Unlinked.", true);
      router.refresh();
    } finally {
      setLinkBusy(false);
    }
  };

  const previewUrl = `/${locale === "en" ? "" : `${locale}/`}blog/${slug || post.slug}`;
  const previewFullUrl = `https://renttools.io${previewUrl}`;
  const previewExcerpt = excerpt.trim().length > 0
    ? excerpt
    : "Set an excerpt to control how this post appears in Google and on social cards.";
  const previewOgImage = ogImageUrl.trim().length > 0 ? ogImageUrl.trim() : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard?view=admin"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Admin
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="truncate text-sm font-medium">{title || "Untitled"}</span>
            <span className="ml-2 inline-flex items-center rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {locale}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                status === "published"
                  ? "bg-primary/15 text-primary"
                  : status === "archived"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {status === "published" && (
              <Link
                href={previewUrl}
                target="_blank"
                rel="noopener"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View live ↗
              </Link>
            )}
            {message && (
              <span className={`text-xs ${message.ok ? "text-primary" : "text-destructive"}`}>
                {message.text}
              </span>
            )}
            <Button
              onClick={() => void save()}
              disabled={!dirty || saving}
              className="h-9 rounded-lg px-4"
            >
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              SEO preview
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Google search result
                </p>
                <div className="rounded-md border border-border/50 bg-background/40 p-3">
                  <div className="truncate text-[13px] text-muted-foreground">
                    renttools.io{previewUrl} <span className="text-muted-foreground/50">›</span>
                  </div>
                  <div className="mt-1 line-clamp-1 text-[18px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
                    {title || "Untitled post"}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px] text-foreground/70">
                    {previewExcerpt}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Social card (Open Graph / Twitter)
                </p>
                <div className="overflow-hidden rounded-md border border-border/50 bg-background/40">
                  <div className="aspect-[1.91/1] w-full overflow-hidden bg-muted/20">
                    {previewOgImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewOgImage}
                        alt=""
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[10px] uppercase tracking-wide text-muted-foreground/50">
                        Site OG image fallback
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      renttools.io
                    </div>
                    <div className="line-clamp-2 text-sm font-medium leading-snug">
                      {title || "Untitled post"}
                    </div>
                    <div className="line-clamp-2 text-[11px] text-muted-foreground">
                      {previewExcerpt}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 break-all font-mono text-[10px] text-muted-foreground/60">
              {previewFullUrl}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="ed-title">
              Title
            </label>
            <Input
              id="ed-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              className="h-11 rounded-lg bg-background/50 text-base font-medium"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="ed-slug">
                  Slug
                </label>
                <Input
                  id="ed-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  maxLength={SLUG_MAX}
                  className="h-9 rounded-lg bg-background/50 font-mono text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="ed-locale">
                  Locale
                </label>
                <select
                  id="ed-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as "en" | "ru")}
                  className="h-9 rounded-lg border border-border/60 bg-background/50 px-2 text-xs"
                >
                  <option value="en">en</option>
                  <option value="ru">ru</option>
                </select>
              </div>
            </div>
            <label className="mt-3 mb-1 block text-xs text-muted-foreground" htmlFor="ed-excerpt">
              Excerpt (used as meta description; aim for 140-160 chars)
            </label>
            <textarea
              id="ed-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={EXCERPT_MAX}
              rows={2}
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {excerpt.length} / {EXCERPT_MAX}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Body (markdown)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">{wordCount} words</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg px-2 text-xs"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? "Hide preview" : "Show preview"}
                </Button>
              </div>
            </div>
            <div className={`grid gap-0 ${showPreview ? "md:grid-cols-2" : ""}`}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={28}
                spellCheck={false}
                className="w-full bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
                placeholder="# Heading&#10;&#10;Write the post body in markdown."
              />
              {showPreview && (
                <div
                  className="prose-blog max-h-[700px] overflow-y-auto border-l border-border/40 p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published" | "archived")
              }
              className="h-9 w-full rounded-lg border border-border/60 bg-background/50 px-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <label
              className="mt-3 mb-1 block text-xs text-muted-foreground"
              htmlFor="ed-publishedAt"
            >
              Publish at
            </label>
            <input
              id="ed-publishedAt"
              type="datetime-local"
              value={publishedAtLocal}
              onChange={(e) => setPublishedAtLocal(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/60 bg-background/50 px-2 text-xs"
            />
            <p className="mt-2 text-[10px] text-muted-foreground/70">
              First publish auto-stamps now if blank. Posts dated in the future stay
              hidden until that time.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tags
            </p>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ical, sync, hosts"
              className="h-9 rounded-lg bg-background/50 text-xs"
            />
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Comma-separated, lowercased on save. Manage rename / merge from Admin · Blog · Tags.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Open Graph image
            </p>
            <Input
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://renttools.io/og/post.png"
              maxLength={OG_URL_MAX}
              className="h-9 rounded-lg bg-background/50 font-mono text-[11px]"
            />
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Optional. Falls back to the site-wide OG image when blank.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Translation pair
            </p>
            {translationSibling ? (
              <div className="space-y-2">
                <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
                  <div className="font-medium">{translationSibling.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    /{translationSibling.locale === "en" ? "" : `${translationSibling.locale}/`}
                    blog/{translationSibling.slug}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                    {translationSibling.locale} · {translationSibling.status}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full rounded-lg text-xs text-destructive hover:text-destructive"
                  onClick={() => void unlinkTranslation()}
                  disabled={linkBusy}
                >
                  Unlink
                </Button>
              </div>
            ) : candidates.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/70">
                No {locale === "en" ? "RU" : "EN"} posts available to pair. Create the
                translation first, then link from either side.
              </p>
            ) : (
              <div className="space-y-2">
                <select
                  value={linkOtherId}
                  onChange={(e) => setLinkOtherId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background/50 px-2 text-xs"
                >
                  <option value="">Pick a {locale === "en" ? "RU" : "EN"} post…</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} · /{c.slug}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="h-8 w-full rounded-lg text-xs"
                  onClick={() => {
                    const otherId = Number(linkOtherId);
                    if (Number.isInteger(otherId) && otherId > 0) {
                      void linkTranslation(otherId);
                    }
                  }}
                  disabled={linkBusy || !linkOtherId}
                >
                  Link translation
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-[11px] text-muted-foreground/80">
            <p>
              Author: {post.authorUsername ?? `#${post.authorId}`}
            </p>
            <p className="mt-1">Created: {post.createdAt.slice(0, 16).replace("T", " ")}</p>
            {post.updatedAt && (
              <p className="mt-1">Updated: {post.updatedAt.slice(0, 16).replace("T", " ")}</p>
            )}
            <p className="mt-1">Comments: {post.commentCount}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
