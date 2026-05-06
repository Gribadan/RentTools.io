"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 20 — Blog media sub-route at
// /dashboard/admin/content/blog-media. First slice off the long-scroll
// AdminPanel "Admin · Blog" section (lines ~1728-2450 of admin-panel.tsx,
// ~720 lines total across Posts/Comments/Tags/Media sub-tabs). The Media
// tab is read-only and derived purely from BlogPost.ogImageUrl, so it's
// the smallest, lowest-risk slice to migrate first. Reuses
// /api/admin/blog-posts (already superadmin-gated) — no API change.
// Native dark-palette tokens replace the legacy shadcn primitives so the
// surface matches the rest of the migrated shell. AdminPanel still
// renders its own copy until the SettingsPanel removal sweep ships.
//
// Direct image uploads ship once R2 / S3 storage is wired (RT-21.x);
// until then this page surfaces what's already referenced via
// post.ogImageUrl.

interface BlogPostRow {
  id: number;
  slug: string;
  locale: string;
  title: string;
  status: string;
  ogImageUrl: string | null;
}

interface MediaUsageRow {
  url: string;
  posts: { id: number; title: string; slug: string; locale: string; status: string }[];
}

interface MeResponse {
  user?: { role: string } | null;
}

export default function AdminBlogMediaPage() {
  const { locale } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setRoleLoaded(true));
  }, []);

  const isSuperadmin = role === "superadmin";

  useEffect(() => {
    if (!isSuperadmin) return;
    void load();
  }, [isSuperadmin]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog-posts");
      if (!res.ok) {
        setError(
          locale === "ru"
            ? `Не удалось загрузить статьи (${res.status})`
            : `Failed to load blog posts (${res.status})`,
        );
        return;
      }
      const data = (await res.json()) as BlogPostRow[];
      setPosts(data);
    } catch {
      setError(locale === "ru" ? "Не удалось загрузить статьи" : "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const mediaUsage = useMemo<MediaUsageRow[]>(() => {
    const map = new Map<string, MediaUsageRow["posts"]>();
    for (const p of posts) {
      if (!p.ogImageUrl) continue;
      const list = map.get(p.ogImageUrl);
      const entry = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        locale: p.locale,
        status: p.status,
      };
      if (list) list.push(entry);
      else map.set(p.ogImageUrl, [entry]);
    }
    return Array.from(map.entries())
      .map(([url, posts]) => ({ url, posts }))
      .sort((a, b) => b.posts.length - a.posts.length);
  }, [posts]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Медиа блога" : "Blog media"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Все внешние OG-картинки, на которые ссылаются статьи блога. Прямая загрузка появится после подключения R2 / S3 (RT-21.x); пока страница только показывает то, что уже привязано к post.ogImageUrl."
            : "Every external OG image URL referenced by a blog post. Direct uploads ship once R2 / S3 storage is wired (RT-21.x); for now this surfaces what's already attached to post.ogImageUrl."}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Только суперадминистратор может видеть медиа блога."
            : "Only superadmins can view blog media."}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
              {locale === "ru" ? "Картинки" : "Images"}
              {mediaUsage.length > 0 && ` · ${mediaUsage.length}`}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-md px-2.5 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              {loading
                ? locale === "ru"
                  ? "Обновляется..."
                  : "Refreshing..."
                : locale === "ru"
                ? "Обновить"
                : "Refresh"}
            </button>
          </div>

          {error && <p className="px-3 py-2 text-xs text-rose-300">{error}</p>}
          {!error && mediaUsage.length === 0 && !loading && (
            <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
              {locale === "ru"
                ? "Ни одна статья ещё не ссылается на OG-картинку. Назначьте её в редакторе статьи."
                : "No posts reference an OG image yet. Set one from the post editor."}
            </p>
          )}
          {mediaUsage.length > 0 && (
            <ul className="divide-y divide-[var(--line)]/50">
              {mediaUsage.map((m) => (
                <li key={m.url} className="flex items-start gap-3 px-3 py-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-md border border-[var(--line)]/60 bg-[var(--bg-3)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener"
                      className="block break-all font-mono text-[11px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:underline"
                    >
                      {m.url}
                    </a>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                      {locale === "ru"
                        ? `Используется в ${m.posts.length} ${m.posts.length === 1 ? "статье" : "статьях"}`
                        : `Used by ${m.posts.length} post${m.posts.length === 1 ? "" : "s"}`}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {m.posts.map((p) => (
                        <li key={p.id} className="text-xs text-[var(--ink-3)]">
                          <span>{p.title}</span>{" "}
                          <span className="text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                            · {p.locale} · {p.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
