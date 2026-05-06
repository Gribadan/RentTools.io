"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 23 — Blog posts sub-route at
// /dashboard/admin/content/blog-posts. Final slice of the long-scroll
// AdminPanel "Admin · Blog" section (joining tick 20 Media, tick 21
// Comments, tick 22 Tags). Migrates the largest sub-tab: posts list
// with status / locale filters + sortable columns, bulk select with
// shift-click range, bulk publish / draft / archive, per-row status
// edit + delete, and the create-draft form. Reuses
// /api/admin/blog-posts GET/POST, /api/admin/blog-posts/[id]
// PATCH/DELETE, /api/admin/blog-posts/bulk-status — all already
// superadmin-gated. Editor link still points at /admin/blog/[id]
// (the existing post editor surface). Native dark-palette tokens
// replace the legacy shadcn Table + Input + Button primitives.
// Sidebar's "Blog posts" entry under Content gets href; admin-home
// tile grid Content section gains the matching tile. AdminPanel
// still keeps its copy until the SettingsPanel removal sweep.

interface BlogPostRow {
  id: number;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  status: string;
  authorId: number;
  authorUsername: string | null;
  tags: string[];
  ogImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
}

interface NewPostDraft {
  title: string;
  slug: string;
  locale: "en" | "ru";
  excerpt: string;
}

interface MeResponse {
  user?: { role: string } | null;
}

type StatusFilter = "all" | "draft" | "published" | "archived";
type LocaleFilter = "all" | "en" | "ru";
type SortKey = "createdAt" | "title" | "status" | "locale" | "publishedAt" | "commentCount";
type SortDir = "asc" | "desc";

const EMPTY_NEW_POST: NewPostDraft = { title: "", slug: "", locale: "en", excerpt: "" };

const TITLE_MAX = 200;
const SLUG_MAX = 80;
const EXCERPT_MAX = 320;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export default function AdminBlogPostsPage() {
  const { locale } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [localeFilter, setLocaleFilter] = useState<LocaleFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [newPost, setNewPost] = useState<NewPostDraft>(EMPTY_NEW_POST);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const setPostStatus = async (post: BlogPostRow, nextStatus: string) => {
    if (post.status === nextStatus) return;
    setBusy(post.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id: post.id,
          text: data.error ?? (locale === "ru" ? "Не удалось обновить" : "Failed to update"),
          ok: false,
        });
        return;
      }
      setMessage({
        id: post.id,
        text: locale === "ru" ? "Обновлено." : "Updated.",
        ok: true,
      });
      await load();
    } finally {
      setBusy(null);
      setTimeout(() => setMessage((m) => (m && m.id === post.id ? null : m)), 4000);
    }
  };

  const remove = async (post: BlogPostRow) => {
    const warn =
      post.commentCount > 0
        ? locale === "ru"
          ? `Удалить «${post.title}»? Будет также удалено ${post.commentCount} комментариев. Действие необратимо.`
          : `Delete "${post.title}"? This will also remove ${post.commentCount} comment(s). This cannot be undone.`
        : locale === "ru"
          ? `Удалить «${post.title}»? Действие необратимо.`
          : `Delete "${post.title}"? This cannot be undone.`;
    if (!confirm(warn)) return;
    setBusy(post.id);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id: post.id,
          text: data.error ?? (locale === "ru" ? "Не удалось удалить" : "Failed to delete"),
          ok: false,
        });
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(
          data.error ?? (locale === "ru" ? "Не удалось создать" : "Failed to create"),
        );
        return;
      }
      setNewPost(EMPTY_NEW_POST);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" || key === "locale" || key === "status" ? "asc" : "desc");
    }
  };

  const filtered = useMemo(() => {
    let rows = posts;
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    if (localeFilter !== "all") rows = rows.filter((r) => r.locale === localeFilter);
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "locale") cmp = a.locale.localeCompare(b.locale);
      else if (sortKey === "commentCount") cmp = a.commentCount - b.commentCount;
      else if (sortKey === "publishedAt") {
        const av = a.publishedAt ?? "";
        const bv = b.publishedAt ?? "";
        if (av === "" && bv === "") cmp = 0;
        else if (av === "") cmp = -1;
        else if (bv === "") cmp = 1;
        else cmp = av.localeCompare(bv);
      } else {
        cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [posts, statusFilter, localeFilter, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const toggleSelection = (post: BlogPostRow, index: number, withShift: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (withShift && lastClickedIndex !== null && lastClickedIndex !== index) {
        const lo = Math.min(lastClickedIndex, index);
        const hi = Math.max(lastClickedIndex, index);
        const shouldSelect = !prev.has(post.id);
        for (let i = lo; i <= hi; i++) {
          const row = filtered[i];
          if (!row) continue;
          if (shouldSelect) next.add(row.id);
          else next.delete(row.id);
        }
      } else if (next.has(post.id)) {
        next.delete(post.id);
      } else {
        next.add(post.id);
      }
      return next;
    });
    setLastClickedIndex(index);
  };

  const clearSelection = () => {
    setSelected(new Set());
    setLastClickedIndex(null);
  };

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((p) => p.id)));
  };

  const bulkSetStatus = async (status: "draft" | "published" | "archived") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const verbEn = status === "published" ? "Publish" : status === "archived" ? "Archive" : "Move to draft";
    const verbRu = status === "published" ? "Опубликовать" : status === "archived" ? "Архивировать" : "В черновик";
    const confirmText =
      locale === "ru"
        ? `${verbRu} ${ids.length} статей?`
        : `${verbEn} ${ids.length} post(s)?`;
    if (!confirm(confirmText)) return;
    setBulkBusy(true);
    setBulkMessage(null);
    try {
      const res = await fetch("/api/admin/blog-posts/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setBulkMessage({
          text: data.error ?? (locale === "ru" ? "Массовое обновление не удалось" : "Bulk update failed"),
          ok: false,
        });
        return;
      }
      const data = (await res.json()) as { updated: number; skipped: number[] };
      setBulkMessage({
        text:
          locale === "ru"
            ? `Обновлено ${data.updated}${data.skipped.length > 0 ? `, пропущено ${data.skipped.length}` : ""}.`
            : `Updated ${data.updated} post(s)${data.skipped.length > 0 ? `, skipped ${data.skipped.length}` : ""}.`,
        ok: true,
      });
      clearSelection();
      await load();
    } finally {
      setBulkBusy(false);
      setTimeout(() => setBulkMessage(null), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Статьи блога" : "Blog posts"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Управление статьями: статус, метаданные, удаление, массовая публикация. Содержимое и теги редактируются на странице редактора каждой статьи."
            : "Manage posts: status, metadata, delete, bulk publish. Body, tags, and translation pairing are edited from each post's dedicated editor page."}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Только суперадминистратор может управлять статьями блога."
            : "Only superadmins can manage blog posts."}
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[var(--ink-4)]" htmlFor="post-status">
              {locale === "ru" ? "Статус" : "Status"}
            </label>
            <select
              id="post-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            >
              <option value="all">{locale === "ru" ? "Все" : "All"}</option>
              <option value="draft">{locale === "ru" ? "Черновик" : "Draft"}</option>
              <option value="published">{locale === "ru" ? "Опубликовано" : "Published"}</option>
              <option value="archived">{locale === "ru" ? "Архив" : "Archived"}</option>
            </select>
            <label className="ml-3 text-xs text-[var(--ink-4)]" htmlFor="post-locale">
              {locale === "ru" ? "Язык" : "Locale"}
            </label>
            <select
              id="post-locale"
              value={localeFilter}
              onChange={(e) => setLocaleFilter(e.target.value as LocaleFilter)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            >
              <option value="all">{locale === "ru" ? "Все" : "All"}</option>
              <option value="en">en</option>
              <option value="ru">ru</option>
            </select>
            <span className="ml-auto text-xs text-[var(--ink-4)]">
              {filtered.length} / {posts.length}
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

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ink)]/30 bg-[var(--bg-3)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--ink)]">
                {locale === "ru"
                  ? `Выбрано ${selected.size}`
                  : `${selected.size} selected`}
              </span>
              <button
                type="button"
                onClick={() => void bulkSetStatus("published")}
                disabled={bulkBusy}
                className="rounded-md bg-[var(--ink)] px-3 py-1 text-xs font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {locale === "ru" ? "Опубликовать" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => void bulkSetStatus("draft")}
                disabled={bulkBusy}
                className="rounded-md px-3 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {locale === "ru" ? "В черновик" : "Move to draft"}
              </button>
              <button
                type="button"
                onClick={() => void bulkSetStatus("archived")}
                disabled={bulkBusy}
                className="rounded-md px-3 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
              >
                {locale === "ru" ? "Архив" : "Archive"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkBusy}
                className="rounded-md px-3 py-1 text-xs text-[var(--ink-4)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {locale === "ru" ? "Очистить" : "Clear"}
              </button>
              {bulkMessage && (
                <span
                  className={`ml-auto text-xs ${
                    bulkMessage.ok ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {bulkMessage.text}
                </span>
              )}
            </div>
          )}

          {/* Posts list */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
            {error && <p className="px-3 py-2 text-xs text-rose-300">{error}</p>}
            {!error && filtered.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {posts.length === 0
                  ? locale === "ru"
                    ? "Статей ещё нет. Создайте черновик ниже."
                    : "No blog posts yet. Use the form below to create your first draft."
                  : locale === "ru"
                    ? "Нет статей под текущие фильтры."
                    : "No posts match the current filters."}
              </p>
            )}
            {filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)]/50 text-left text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                      <th className="w-8 px-3 py-2 font-medium">
                        <input
                          type="checkbox"
                          aria-label={locale === "ru" ? "Выбрать всё видимое" : "Select all visible posts"}
                          checked={
                            filtered.length > 0 && filtered.every((p) => selected.has(p.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) selectAllFiltered();
                            else clearSelection();
                          }}
                        />
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("title")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {locale === "ru" ? "Заголовок" : "Title"}
                          {sortIndicator("title")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("locale")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {locale === "ru" ? "Язык" : "Locale"}
                          {sortIndicator("locale")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("status")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {locale === "ru" ? "Статус" : "Status"}
                          {sortIndicator("status")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">{locale === "ru" ? "Автор" : "Author"}</th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("createdAt")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {locale === "ru" ? "Создано" : "Created"}
                          {sortIndicator("createdAt")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("publishedAt")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {locale === "ru" ? "Опубл." : "Published"}
                          {sortIndicator("publishedAt")}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("commentCount")}
                          className="transition-colors hover:text-[var(--ink-2)]"
                        >
                          {locale === "ru" ? "Комм." : "Comments"}
                          {sortIndicator("commentCount")}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {locale === "ru" ? "Действия" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((post, index) => (
                      <tr
                        key={post.id}
                        className={`border-b border-[var(--line)]/30 last:border-b-0 ${
                          selected.has(post.id) ? "bg-[var(--bg-3)]/50" : ""
                        }`}
                      >
                        <td className="w-8 px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Select ${post.title}`}
                            checked={selected.has(post.id)}
                            onClick={(e) => toggleSelection(post, index, e.shiftKey)}
                            onChange={() => {
                              /* handled in onClick to access shiftKey */
                            }}
                          />
                        </td>
                        <td className="max-w-[280px] px-3 py-2">
                          <div className="truncate text-sm font-medium text-[var(--ink)]">
                            {post.title}
                          </div>
                          <div className="truncate font-mono text-[10px] text-[var(--ink-4)]">
                            /{post.locale === "en" ? "" : `${post.locale}/`}blog/{post.slug}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center rounded-md bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                            {post.locale}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={post.status}
                            onChange={(e) => void setPostStatus(post, e.target.value)}
                            disabled={busy === post.id}
                            className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
                          >
                            <option value="draft">{locale === "ru" ? "Черновик" : "Draft"}</option>
                            <option value="published">{locale === "ru" ? "Опубл." : "Published"}</option>
                            <option value="archived">{locale === "ru" ? "Архив" : "Archived"}</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-[var(--ink-3)]">
                          {post.authorUsername ?? `#${post.authorId}`}
                        </td>
                        <td className="px-3 py-2 text-[var(--ink-3)]">{formatDate(post.createdAt)}</td>
                        <td className="px-3 py-2 text-[var(--ink-3)]">{formatDate(post.publishedAt)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-2)]">
                          {post.commentCount}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/admin/blog/${post.id}`}
                              className="text-[11px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] hover:underline"
                            >
                              {locale === "ru" ? "Редакт." : "Edit"}
                            </a>
                            <button
                              type="button"
                              onClick={() => void remove(post)}
                              disabled={busy === post.id}
                              className="rounded-md px-2 py-1 text-[11px] text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                            >
                              {locale === "ru" ? "Удал." : "Delete"}
                            </button>
                          </div>
                          {message?.id === post.id && (
                            <p
                              className={`mt-1 text-[10px] ${
                                message.ok ? "text-emerald-300" : "text-rose-300"
                              }`}
                            >
                              {message.text}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 px-3 text-[10px] text-[var(--ink-4)]">
              {locale === "ru"
                ? "Подсказка: shift-клик по чекбоксу выделяет диапазон."
                : "Tip: shift-click a checkbox to select a range."}
            </p>
          </div>

          {/* New post */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-3 text-sm font-medium text-[var(--ink)]">
              {locale === "ru" ? "Новая статья" : "New post"}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {locale === "ru"
                ? "Создаётся черновик. Откройте статью, чтобы написать тело, выбрать теги, OG-картинку и связать перевод."
                : "Creates a draft. Open the post afterwards to write the body, set tags, pick an OG image, and link a translation pair."}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost((s) => ({ ...s, title: e.target.value }))}
                placeholder={locale === "ru" ? "Заголовок" : "Title"}
                maxLength={TITLE_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
              <select
                value={newPost.locale}
                onChange={(e) => setNewPost((s) => ({ ...s, locale: e.target.value as "en" | "ru" }))}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              >
                <option value="en">en</option>
                <option value="ru">ru</option>
              </select>
            </div>
            <div className="mt-3 grid gap-2">
              <input
                type="text"
                value={newPost.slug}
                onChange={(e) => setNewPost((s) => ({ ...s, slug: e.target.value }))}
                placeholder={locale === "ru" ? "Слаг (необязательно — генерируется из заголовка)" : "Slug (optional — derived from title if blank)"}
                maxLength={SLUG_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
              <textarea
                value={newPost.excerpt}
                onChange={(e) => setNewPost((s) => ({ ...s, excerpt: e.target.value }))}
                placeholder={locale === "ru"
                  ? "Анонс (140-160 символов, используется как meta description)"
                  : "Excerpt (140-160 chars, used as meta description)"}
                maxLength={EXCERPT_MAX}
                rows={2}
                className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              {createError && <span className="text-xs text-rose-300">{createError}</span>}
              <button
                type="button"
                onClick={() => void create()}
                disabled={creating || newPost.title.trim().length === 0}
                className="h-9 rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {creating
                  ? locale === "ru"
                    ? "Создаётся…"
                    : "Creating…"
                  : locale === "ru"
                  ? "Создать черновик"
                  : "Create draft"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
