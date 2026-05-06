"use client";

import { useMemo, useRef, useState } from "react";
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
  tldr: string;
  faq: { q: string; a: string }[];
  status: "draft" | "published" | "archived";
  authorId: number;
  authorUsername: string | null;
  tags: string[];
  ogImageUrl: string | null;
  ogImageWidth: number | null;
  ogImageHeight: number | null;
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
const TLDR_MAX = 1_000;
const FAQ_QUESTION_MAX = 300;
const FAQ_ANSWER_MAX = 2_000;
const FAQ_MAX_ITEMS = 30;

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
  const [tldr, setTldr] = useState(post.tldr);
  const [faq, setFaq] = useState<{ q: string; a: string }[]>(post.faq);
  const [tagsInput, setTagsInput] = useState(post.tags.join(", "));
  const [ogImageUrl, setOgImageUrl] = useState(post.ogImageUrl ?? "");
  const [ogImageWidth, setOgImageWidth] = useState<number | null>(post.ogImageWidth);
  const [ogImageHeight, setOgImageHeight] = useState<number | null>(post.ogImageHeight);
  const [publishedAtLocal, setPublishedAtLocal] = useState(toLocalDateTimeInput(post.publishedAt));
  const [translationSibling, setTranslationSibling] = useState(post.translationSibling);
  const [linkOtherId, setLinkOtherId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

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
    tldr !== post.tldr ||
    JSON.stringify(faq) !== JSON.stringify(post.faq) ||
    JSON.stringify(tags) !== JSON.stringify(post.tags) ||
    (ogImageUrl.trim() || null) !== (post.ogImageUrl ?? null) ||
    ogImageWidth !== post.ogImageWidth ||
    ogImageHeight !== post.ogImageHeight ||
    fromLocalDateTimeInput(publishedAtLocal) !== post.publishedAt;

  const setStatusMessage = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  /**
   * Apply a markdown transform to the current selection (or caret).
   *
   * `wrap` and `linePrefix` cover every toolbar action we ship:
   *   - wrap: surround the selection with `before`/`after` (bold, italic, code, link)
   *   - linePrefix: prepend a token to each line in the selection (h2, list, quote)
   *
   * Both modes update the textarea synchronously via setBody and then re-focus
   * the input, restoring the selection so chained edits stay natural.
   */
  const applyEdit = (
    mode: "wrap" | "linePrefix" | "insert",
    args: { before?: string; after?: string; prefix?: string; placeholder?: string; insert?: string },
  ) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = body.slice(0, start);
    const selected = body.slice(start, end);
    const after = body.slice(end);
    let nextBody = body;
    let nextStart = start;
    let nextEnd = end;

    if (mode === "wrap") {
      const inner = selected.length > 0 ? selected : (args.placeholder ?? "");
      const piece = `${args.before ?? ""}${inner}${args.after ?? ""}`;
      nextBody = `${before}${piece}${after}`;
      nextStart = start + (args.before?.length ?? 0);
      nextEnd = nextStart + inner.length;
    } else if (mode === "linePrefix") {
      // Find the start of the first selected line; rewrite each line.
      const lineStart = before.lastIndexOf("\n") + 1;
      const block = body.slice(lineStart, end);
      const lines = block.split("\n");
      const rewritten = lines
        .map((ln) => `${args.prefix}${ln.length === 0 ? (args.placeholder ?? "") : ln}`)
        .join("\n");
      nextBody = `${body.slice(0, lineStart)}${rewritten}${after}`;
      nextStart = lineStart;
      nextEnd = lineStart + rewritten.length;
    } else if (mode === "insert") {
      const piece = args.insert ?? "";
      nextBody = `${before}${piece}${after}`;
      nextStart = start + piece.length;
      nextEnd = nextStart;
    }

    setBody(nextBody);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(nextStart, nextEnd);
    });
  };

  const insertLink = () => {
    const url = prompt("URL (https://… or /relative/path):");
    if (!url) return;
    applyEdit("wrap", { before: "[", after: `](${url})`, placeholder: "link text" });
  };

  const handleImageFile = async (file: File, mode: "insert" | "cover" = "insert") => {
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/blog-images", { method: "POST", body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusMessage(data.error ?? "Upload failed", false);
        return;
      }
      const data = (await res.json()) as { url: string; width?: number; height?: number };
      if (mode === "cover") {
        setOgImageUrl(data.url);
        setOgImageWidth(typeof data.width === "number" ? data.width : null);
        setOgImageHeight(typeof data.height === "number" ? data.height : null);
        setStatusMessage("Cover image uploaded.", true);
      } else {
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        applyEdit("insert", { insert: `\n\n![${alt}](${data.url})\n\n` });
        setStatusMessage("Image uploaded.", true);
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Upload failed", false);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
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
          tldr,
          faq: faq.filter((f) => f.q.trim().length > 0 && f.a.trim().length > 0),
          tags,
          ogImageUrl: ogImageUrl.trim().length > 0 ? ogImageUrl.trim() : null,
          ogImageWidth,
          ogImageHeight,
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
                  <div className="mt-1 line-clamp-1 text-[18px] leading-snug text-blue-700 dark:text-blue-300">
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
              <div className="flex flex-wrap items-center gap-1">
                <ToolbarButton
                  title="Heading 2 (##)"
                  onClick={() => applyEdit("linePrefix", { prefix: "## ", placeholder: "Heading" })}
                >
                  H2
                </ToolbarButton>
                <ToolbarButton
                  title="Heading 3 (###)"
                  onClick={() => applyEdit("linePrefix", { prefix: "### ", placeholder: "Heading" })}
                >
                  H3
                </ToolbarButton>
                <ToolbarSeparator />
                <ToolbarButton
                  title="Bold (Ctrl+B)"
                  onClick={() => applyEdit("wrap", { before: "**", after: "**", placeholder: "bold" })}
                >
                  <span className="font-bold">B</span>
                </ToolbarButton>
                <ToolbarButton
                  title="Italic (Ctrl+I)"
                  onClick={() => applyEdit("wrap", { before: "*", after: "*", placeholder: "italic" })}
                >
                  <span className="italic">I</span>
                </ToolbarButton>
                <ToolbarButton
                  title="Inline code"
                  onClick={() => applyEdit("wrap", { before: "`", after: "`", placeholder: "code" })}
                >
                  <span className="font-mono">{`</>`}</span>
                </ToolbarButton>
                <ToolbarSeparator />
                <ToolbarButton
                  title="Bullet list"
                  onClick={() => applyEdit("linePrefix", { prefix: "- ", placeholder: "list item" })}
                >
                  • List
                </ToolbarButton>
                <ToolbarButton
                  title="Numbered list"
                  onClick={() => applyEdit("linePrefix", { prefix: "1. ", placeholder: "list item" })}
                >
                  1. List
                </ToolbarButton>
                <ToolbarButton
                  title="Quote"
                  onClick={() => applyEdit("linePrefix", { prefix: "> ", placeholder: "quote" })}
                >
                  &ldquo; Quote
                </ToolbarButton>
                <ToolbarSeparator />
                <ToolbarButton title="Link" onClick={insertLink}>
                  Link
                </ToolbarButton>
                <ToolbarButton
                  title="Code block"
                  onClick={() =>
                    applyEdit("wrap", { before: "\n```\n", after: "\n```\n", placeholder: "code" })
                  }
                >
                  Code block
                </ToolbarButton>
                <ToolbarButton
                  title="Horizontal rule"
                  onClick={() => applyEdit("insert", { insert: "\n\n---\n\n" })}
                >
                  ―
                </ToolbarButton>
                <ToolbarSeparator />
                <ToolbarButton
                  title="Upload image"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "🖼 Image"}
                </ToolbarButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageFile(file);
                  }}
                />
              </div>
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
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                    e.preventDefault();
                    applyEdit("wrap", { before: "**", after: "**", placeholder: "bold" });
                  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                    e.preventDefault();
                    applyEdit("wrap", { before: "*", after: "*", placeholder: "italic" });
                  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                    e.preventDefault();
                    insertLink();
                  }
                }}
                onPaste={(e) => {
                  const file = Array.from(e.clipboardData.files).find((f) =>
                    f.type.startsWith("image/")
                  );
                  if (file) {
                    e.preventDefault();
                    void handleImageFile(file);
                  }
                }}
                onDragOver={(e) => {
                  if (Array.from(e.dataTransfer.items).some((it) => it.kind === "file")) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  const file = Array.from(e.dataTransfer.files).find((f) =>
                    f.type.startsWith("image/")
                  );
                  if (file) {
                    e.preventDefault();
                    void handleImageFile(file);
                  }
                }}
                rows={28}
                spellCheck={false}
                className="w-full bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
                placeholder="# Heading&#10;&#10;Write the post body in markdown.&#10;&#10;Tip: paste or drag an image to upload it."
              />
              {showPreview && (
                <div
                  className="prose-blog max-h-[700px] overflow-y-auto border-l border-border/40 p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>

          {/* TL;DR — surfaces above the fold on the public post page and is
              prime real estate for keyword-rich opening copy. Stored as
              its own column so the renderer doesn't have to scrape for a
              `## TL;DR` section in the body. Markdown bullet syntax is
              accepted (one bullet per line) and rendered as a list. */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                TL;DR
              </p>
              <span className="text-[10px] text-muted-foreground/70">
                {tldr.length} / {TLDR_MAX}
              </span>
            </div>
            <textarea
              value={tldr}
              onChange={(e) => setTldr(e.target.value.slice(0, TLDR_MAX))}
              rows={4}
              spellCheck
              className="w-full resize-y rounded-lg border border-border/40 bg-background/50 p-3 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder={
                "- Both Airbnb and Booking.com expose iCal export URLs for free.\n- iCal sync is not real-time — refresh windows are 2–6 hours.\n- For 1–3 listings, free is more than enough."
              }
            />
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Renders as a callout above the article body. Use markdown-style bullets.
            </p>
          </div>

          {/* FAQ — structured Q/A pairs. Drives both the on-page Q/A
              section AND the FAQPage JSON-LD that makes posts eligible
              for Google rich-result expansion. Each Q/A is a row in the
              repeater; reorder with the up/down buttons. */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  FAQ
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  Emits FAQPage schema. Each answer accepts plain text — no markdown.
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/70">
                {faq.length} / {FAQ_MAX_ITEMS}
              </span>
            </div>
            <div className="space-y-3">
              {faq.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/40 bg-background/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Q{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Move up"
                        disabled={idx === 0}
                        onClick={() => {
                          if (idx === 0) return;
                          const next = faq.slice();
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          setFaq(next);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        disabled={idx === faq.length - 1}
                        onClick={() => {
                          if (idx === faq.length - 1) return;
                          const next = faq.slice();
                          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                          setFaq(next);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <input
                    value={item.q}
                    onChange={(e) => {
                      const next = faq.slice();
                      next[idx] = { ...item, q: e.target.value.slice(0, FAQ_QUESTION_MAX) };
                      setFaq(next);
                    }}
                    placeholder="Question…"
                    className="mb-2 h-9 w-full rounded-md border border-border/40 bg-background/50 px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <textarea
                    value={item.a}
                    onChange={(e) => {
                      const next = faq.slice();
                      next[idx] = { ...item, a: e.target.value.slice(0, FAQ_ANSWER_MAX) };
                      setFaq(next);
                    }}
                    rows={3}
                    placeholder="Answer…"
                    className="w-full resize-y rounded-md border border-border/40 bg-background/50 p-3 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full rounded-lg text-xs"
                disabled={faq.length >= FAQ_MAX_ITEMS}
                onClick={() => setFaq([...faq, { q: "", a: "" }])}
              >
                + Add question
              </Button>
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
              Cover image (also OG)
            </p>
            {ogImageUrl ? (
              <div className="mb-3 overflow-hidden rounded-md border border-border/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ogImageUrl}
                  alt="Cover preview"
                  className="aspect-[1.91/1] w-full object-cover"
                />
                {(ogImageWidth && ogImageHeight) && (
                  <p className="px-2 py-1 text-[10px] text-muted-foreground/70">
                    {ogImageWidth}×{ogImageHeight}
                  </p>
                )}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 rounded-lg text-xs"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : ogImageUrl ? "Replace" : "Upload"}
              </Button>
              {ogImageUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                  onClick={() => {
                    setOgImageUrl("");
                    setOgImageWidth(null);
                    setOgImageHeight(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageFile(file, "cover");
              }}
            />
            <Input
              value={ogImageUrl}
              onChange={(e) => {
                setOgImageUrl(e.target.value);
                // External URLs lose width/height — null them so JSON-LD
                // doesn't ship stale dimensions for a different image.
                setOgImageWidth(null);
                setOgImageHeight(null);
              }}
              placeholder="…or paste an external URL"
              maxLength={OG_URL_MAX}
              className="mt-2 h-8 rounded-lg bg-background/50 font-mono text-[10px]"
            />
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Used as the post hero AND the social-card image. Falls back to the
              site-wide OG image when blank.
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

interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ title, onClick, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <span aria-hidden className="mx-0.5 h-4 w-px bg-border/60" />;
}
