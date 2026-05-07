"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loading: string;
  notSuperadmin: string;
  filterAll: string;
  filterNew: string;
  filterRead: string;
  filterArchived: string;
  refreshing: string;
  refresh: string;
  empty: string;
  anonymous: string;
  markRead: string;
  archive: string;
  restore: string;
  delete: string;
  confirmDelete: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Feedback",
    description:
      "Messages from site visitors via the floating Feedback button. Spam-gated by 30-second per-IP rate limit + honeypot.",
    loading: "Loading...",
    notSuperadmin: "Only superadmins can review feedback.",
    filterAll: "All",
    filterNew: "New",
    filterRead: "Read",
    filterArchived: "Archived",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    empty: "No feedback yet.",
    anonymous: "anonymous",
    markRead: "Mark read",
    archive: "Archive",
    restore: "Restore",
    delete: "Delete",
    confirmDelete: "Permanently delete?",
  },
  ru: {
    title: "Обратная связь",
    description:
      "Сообщения от посетителей сайта (кнопка «Feedback» в правом нижнем углу). Защита от спама — лимит 1 сообщение / 30 секунд по IP.",
    loading: "Загрузка...",
    notSuperadmin: "Только суперадминистратор видит этот раздел.",
    filterAll: "Все",
    filterNew: "Новые",
    filterRead: "Прочитанные",
    filterArchived: "Архив",
    refreshing: "Обновляется...",
    refresh: "Обновить",
    empty: "Сообщений нет.",
    anonymous: "аноним",
    markRead: "Прочитано",
    archive: "В архив",
    restore: "Восстановить",
    delete: "Удалить",
    confirmDelete: "Удалить навсегда?",
  },
  de: {
    title: "Feedback",
    description:
      "Nachrichten von Website-Besuchern über den schwebenden Feedback-Button. Spam-Schutz: 30-Sekunden-Limit pro IP plus Honeypot.",
    loading: "Wird geladen...",
    notSuperadmin: "Nur Superadmins können Feedback einsehen.",
    filterAll: "Alle",
    filterNew: "Neu",
    filterRead: "Gelesen",
    filterArchived: "Archiviert",
    refreshing: "Wird aktualisiert...",
    refresh: "Aktualisieren",
    empty: "Noch kein Feedback.",
    anonymous: "anonym",
    markRead: "Als gelesen markieren",
    archive: "Archivieren",
    restore: "Wiederherstellen",
    delete: "Löschen",
    confirmDelete: "Endgültig löschen?",
  },
  fr: {
    title: "Retours",
    description:
      "Messages des visiteurs du site via le bouton flottant Feedback. Anti-spam : limite de 30 secondes par IP plus honeypot.",
    loading: "Chargement...",
    notSuperadmin: "Seuls les superadmins peuvent consulter les retours.",
    filterAll: "Tous",
    filterNew: "Nouveaux",
    filterRead: "Lus",
    filterArchived: "Archivés",
    refreshing: "Actualisation...",
    refresh: "Actualiser",
    empty: "Aucun retour pour l'instant.",
    anonymous: "anonyme",
    markRead: "Marquer comme lu",
    archive: "Archiver",
    restore: "Restaurer",
    delete: "Supprimer",
    confirmDelete: "Supprimer définitivement ?",
  },
  es: {
    title: "Comentarios",
    description:
      "Mensajes de los visitantes del sitio a través del botón flotante de Feedback. Antispam: límite de 30 segundos por IP más honeypot.",
    loading: "Cargando...",
    notSuperadmin: "Solo los superadministradores pueden revisar los comentarios.",
    filterAll: "Todos",
    filterNew: "Nuevos",
    filterRead: "Leídos",
    filterArchived: "Archivados",
    refreshing: "Actualizando...",
    refresh: "Actualizar",
    empty: "Aún no hay comentarios.",
    anonymous: "anónimo",
    markRead: "Marcar como leído",
    archive: "Archivar",
    restore: "Restaurar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar de forma permanente?",
  },
};

// Site-wide visitor feedback queue. Source: the floating
// FeedbackButton mounted in the root layout. Super-admin only.
//
// Surface mirrors the existing /dashboard/admin/content/blog-comments
// admin page (filter chips, table, mark-as-X actions) so the chrome
// stays consistent across the admin section.

interface FeedbackRow {
  id: number;
  body: string;
  contactEmail: string | null;
  pagePath: string;
  userAgent: string;
  status: "new" | "read" | "archived";
  createdAt: string;
  updatedAt: string | null;
  user: { id: number; username: string | null } | null;
}

interface CountsResponse {
  new: number;
  read: number;
  archived: number;
}

interface MeResponse {
  user?: { role: string } | null;
}

type StatusFilter = "all" | "new" | "read" | "archived";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // Show date + HH:MM since feedback timestamps cluster more by hour
  // than by day.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function AdminFeedbackPage() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [counts, setCounts] = useState<CountsResponse>({ new: 0, read: 0, archived: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: MeResponse) => {
        setRole(data?.user?.role ?? null);
        setRoleLoaded(true);
      })
      .catch(() => {
        setRoleLoaded(true);
      });
  }, []);

  const isSuperadmin = role === "superadmin";

  const load = async () => {
    if (!isSuperadmin) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/feedback", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      const res = await fetch(url.toString());
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Failed to load (${res.status})`);
        return;
      }
      const data = (await res.json()) as { items: FeedbackRow[]; counts: CountsResponse };
      setItems(data.items);
      setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperadmin, statusFilter]);

  const setStatus = async (id: number, status: "new" | "read" | "archived") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Failed (${res.status})`);
        return;
      }
      void load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(c.confirmDelete)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Failed (${res.status})`);
        return;
      }
      void load();
    } finally {
      setBusy(null);
    }
  };

  const statusPillClass = (status: string): string => {
    if (status === "new") return "bg-[var(--m-accent)]/15 text-[var(--m-accent)]";
    if (status === "read") return "bg-[var(--bg-3)] text-[var(--ink-3)]";
    return "bg-[var(--bg-3)]/50 text-[var(--ink-4)]";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {c.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {c.description}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {c.loading}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {c.notSuperadmin}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "new", "read", "archived"] as const).map((f) => {
              const count =
                f === "all"
                  ? counts.new + counts.read + counts.archived
                  : counts[f];
              const active = statusFilter === f;
              const label =
                f === "all"
                  ? c.filterAll
                  : f === "new"
                    ? c.filterNew
                    : f === "read"
                      ? c.filterRead
                      : c.filterArchived;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-[var(--m-accent)] bg-[var(--m-accent)]/10 text-[var(--m-accent)]"
                      : "border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 text-[10px] text-[var(--ink-4)]">{count}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="ml-auto rounded-md px-2.5 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              {loading ? c.refreshing : c.refresh}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
            {error && <p className="px-3 py-2 text-xs text-rose-300">{error}</p>}
            {!error && items.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {c.empty}
              </p>
            )}
            {items.length > 0 && (
              <ul className="divide-y divide-[var(--line)]/50">
                {items.map((f) => (
                  <li key={f.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-4)]">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${statusPillClass(f.status)}`}
                          >
                            {f.status}
                          </span>
                          <span>{formatDate(f.createdAt)}</span>
                          {f.user ? (
                            <>
                              <span>·</span>
                              <span className="font-medium text-[var(--ink-2)]">
                                {f.user.username ?? `user #${f.user.id}`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>·</span>
                              <span className="italic">
                                {c.anonymous}
                              </span>
                            </>
                          )}
                          {f.contactEmail && (
                            <>
                              <span>·</span>
                              <a
                                href={`mailto:${f.contactEmail}`}
                                className="font-mono text-[var(--ink-2)] hover:text-[var(--m-accent)] hover:underline"
                              >
                                {f.contactEmail}
                              </a>
                            </>
                          )}
                          {f.pagePath && (
                            <>
                              <span>·</span>
                              <a
                                href={f.pagePath}
                                target="_blank"
                                rel="noopener"
                                className="font-mono text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
                              >
                                {f.pagePath}
                              </a>
                            </>
                          )}
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-2)]">
                          {f.body}
                        </p>
                        {f.userAgent && (
                          <p
                            className="mt-1.5 truncate font-mono text-[10px] text-[var(--ink-4)]"
                            title={f.userAgent}
                          >
                            {f.userAgent}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch gap-1">
                        {f.status === "new" && (
                          <button
                            type="button"
                            onClick={() => void setStatus(f.id, "read")}
                            disabled={busy === f.id}
                            className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                          >
                            {c.markRead}
                          </button>
                        )}
                        {f.status !== "archived" && (
                          <button
                            type="button"
                            onClick={() => void setStatus(f.id, "archived")}
                            disabled={busy === f.id}
                            className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                          >
                            {c.archive}
                          </button>
                        )}
                        {f.status === "archived" && (
                          <button
                            type="button"
                            onClick={() => void setStatus(f.id, "new")}
                            disabled={busy === f.id}
                            className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                          >
                            {c.restore}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void remove(f.id)}
                          disabled={busy === f.id}
                          className="rounded-md border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          {c.delete}
                        </button>
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
