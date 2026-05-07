"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loading: string;
  notSuperadmin: string;
  statusLabel: string;
  filterAll: string;
  filterVisible: string;
  filterHidden: string;
  filterDeleted: string;
  refreshing: string;
  refresh: string;
  loadFailed: (status: number) => string;
  loadFailedShort: string;
  commentsCount: (n: number) => string;
  empty: string;
  confirmDelete: string;
  restore: string;
  hide: string;
  delete: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Blog comments",
    description:
      "Moderation: hide, restore, or soft-delete. Soft-deleted comments stay in the DB for audit.",
    loading: "Loading...",
    notSuperadmin: "Only superadmins can moderate comments.",
    statusLabel: "Status",
    filterAll: "All",
    filterVisible: "Visible",
    filterHidden: "Hidden",
    filterDeleted: "Deleted",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    loadFailed: (status) => `Failed to load comments (${status})`,
    loadFailedShort: "Failed to load comments",
    commentsCount: (n) => `${n} comment${n === 1 ? "" : "s"}`,
    empty: "No comments to moderate.",
    confirmDelete: "Soft-delete this comment? It will be hidden but kept for audit.",
    restore: "Restore",
    hide: "Hide",
    delete: "Delete",
  },
  ru: {
    title: "Комментарии блога",
    description:
      "Модерация: скрыть / восстановить / удалить (мягкое удаление сохраняет запись для аудита).",
    loading: "Загрузка...",
    notSuperadmin: "Только суперадминистратор может модерировать комментарии.",
    statusLabel: "Статус",
    filterAll: "Все",
    filterVisible: "Видимые",
    filterHidden: "Скрытые",
    filterDeleted: "Удалённые",
    refreshing: "Обновляется...",
    refresh: "Обновить",
    loadFailed: (status) => `Не удалось загрузить комментарии (${status})`,
    loadFailedShort: "Не удалось загрузить комментарии",
    commentsCount: (n) => `${n} комментариев`,
    empty: "Нет комментариев для модерации.",
    confirmDelete: "Удалить комментарий? Он будет скрыт, но сохранён для аудита.",
    restore: "Восстановить",
    hide: "Скрыть",
    delete: "Удалить",
  },
  de: {
    title: "Blog-Kommentare",
    description:
      "Moderation: ausblenden, wiederherstellen oder weich löschen. Weich gelöschte Kommentare bleiben für die Revision in der Datenbank.",
    loading: "Wird geladen...",
    notSuperadmin: "Nur Superadmins können Kommentare moderieren.",
    statusLabel: "Status",
    filterAll: "Alle",
    filterVisible: "Sichtbar",
    filterHidden: "Ausgeblendet",
    filterDeleted: "Gelöscht",
    refreshing: "Wird aktualisiert...",
    refresh: "Aktualisieren",
    loadFailed: (status) => `Kommentare konnten nicht geladen werden (${status})`,
    loadFailedShort: "Kommentare konnten nicht geladen werden",
    commentsCount: (n) => `${n} Kommentar${n === 1 ? "" : "e"}`,
    empty: "Keine Kommentare zu moderieren.",
    confirmDelete: "Diesen Kommentar weich löschen? Er wird ausgeblendet, aber für die Revision aufbewahrt.",
    restore: "Wiederherstellen",
    hide: "Ausblenden",
    delete: "Löschen",
  },
};

// RT-25.9 tick 21 — Blog comments sub-route at
// /dashboard/admin/content/blog-comments. Second slice off the
// long-scroll AdminPanel "Admin · Blog" section. Migrates moderation:
// list with status filter, hide / restore, soft-delete. Reuses
// /api/admin/blog-comments GET (filter via ?status) and
// /api/blog-comments/[id] PATCH/DELETE — all superadmin-gated. Native
// dark-palette tokens replace the legacy shadcn primitives. AdminPanel
// still renders its own copy until the SettingsPanel removal sweep.

interface BlogCommentRow {
  id: number;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  user: { id: number; username: string | null };
  post: { id: number; slug: string; locale: string; title: string };
}

type StatusFilter = "all" | "visible" | "hidden" | "deleted";

interface MeResponse {
  user?: { role: string } | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export default function AdminBlogCommentsPage() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [comments, setComments] = useState<BlogCommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState<number | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperadmin, statusFilter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/blog-comments", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      const res = await fetch(url.toString());
      if (!res.ok) {
        setError(t.loadFailed(res.status));
        return;
      }
      const data = (await res.json()) as BlogCommentRow[];
      setComments(data);
    } catch {
      setError(t.loadFailedShort);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id: number, status: "visible" | "hidden") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/blog-comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      await load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/blog-comments/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      await load();
    } finally {
      setBusy(null);
    }
  };

  const statusPillClass = (status: string): string => {
    if (status === "visible") return "bg-emerald-500/15 text-emerald-300";
    if (status === "hidden") return "bg-[var(--bg-3)] text-[var(--ink-3)]";
    return "bg-rose-500/15 text-rose-300";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.description}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {t.loading}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {t.notSuperadmin}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[var(--ink-4)]" htmlFor="comment-status">
              {t.statusLabel}
            </label>
            <select
              id="comment-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            >
              <option value="all">{t.filterAll}</option>
              <option value="visible">{t.filterVisible}</option>
              <option value="hidden">{t.filterHidden}</option>
              <option value="deleted">{t.filterDeleted}</option>
            </select>
            <span className="ml-auto text-xs text-[var(--ink-4)]">
              {t.commentsCount(comments.length)}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-md px-2.5 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              {loading ? t.refreshing : t.refresh}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
            {error && <p className="px-3 py-2 text-xs text-rose-300">{error}</p>}
            {!error && comments.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {t.empty}
              </p>
            )}
            {comments.length > 0 && (
              <ul className="divide-y divide-[var(--line)]/50">
                {comments.map((c) => (
                  <li key={c.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-4)]">
                          <a
                            href={`/${c.post.locale === "en" ? "" : `${c.post.locale}/`}blog/${c.post.slug}`}
                            target="_blank"
                            rel="noopener"
                            className="font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hover:underline"
                          >
                            {c.post.title}
                          </a>
                          <span>·</span>
                          <span>{c.user.username ?? `user #${c.user.id}`}</span>
                          <span>·</span>
                          <span>{formatDate(c.createdAt)}</span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${statusPillClass(c.status)}`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink-2)]">
                          {c.body}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {c.status === "hidden" && (
                          <button
                            type="button"
                            onClick={() => void setStatus(c.id, "visible")}
                            disabled={busy === c.id}
                            className="rounded-md px-2 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                          >
                            {t.restore}
                          </button>
                        )}
                        {c.status === "visible" && (
                          <button
                            type="button"
                            onClick={() => void setStatus(c.id, "hidden")}
                            disabled={busy === c.id}
                            className="rounded-md px-2 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                          >
                            {t.hide}
                          </button>
                        )}
                        {c.status !== "deleted" && (
                          <button
                            type="button"
                            onClick={() => void remove(c.id)}
                            disabled={busy === c.id}
                            className="rounded-md px-2 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                          >
                            {t.delete}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
