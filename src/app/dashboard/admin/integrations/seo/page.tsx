"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 13 — SEO overrides sub-route at
// /dashboard/admin/integrations/seo. Lifts the "Admin · SEO overrides"
// section out of admin-panel.tsx (lines ~1519-1727) into its own
// deep-linkable surface. Reuses /api/admin/seo GET/POST and
// /api/admin/seo/[id] PUT/DELETE — both already superadmin-gated.
// Non-superadmin users see a permission notice instead of the form.
// Uses native dark-palette tokens (matches the users + site-settings
// migrations from earlier ticks) rather than the shadcn primitives the
// legacy section uses, so the surface is consistent inside the new
// admin shell. SettingsPanel still renders its own copy until the
// removal sweep ships.

interface SeoRow {
  id: number;
  path: string;
  locale: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  canonical: string | null;
}

interface NewSeoDraft {
  path: string;
  locale: "en" | "ru";
  title: string;
  description: string;
  ogImage: string;
  canonical: string;
}

interface MeResponse {
  user?: { role: string } | null;
}

const EMPTY_NEW_SEO: NewSeoDraft = {
  path: "",
  locale: "en",
  title: "",
  description: "",
  ogImage: "",
  canonical: "",
};

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;
const URL_MAX = 512;

export default function AdminSeoOverridesPage() {
  const { locale } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, SeoRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [newSeo, setNewSeo] = useState<NewSeoDraft>(EMPTY_NEW_SEO);
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
      const res = await fetch("/api/admin/seo");
      if (!res.ok) {
        setError(
          locale === "ru"
            ? `Не удалось загрузить переопределения (${res.status})`
            : `Failed to load SEO overrides (${res.status})`,
        );
        return;
      }
      const data = (await res.json()) as SeoRow[];
      setRows(data);
      const next: Record<number, SeoRow> = {};
      for (const r of data) next[r.id] = { ...r };
      setDrafts(next);
    } catch {
      setError(
        locale === "ru"
          ? "Не удалось загрузить переопределения"
          : "Failed to load SEO overrides",
      );
    } finally {
      setLoading(false);
    }
  };

  const isDirty = (row: SeoRow): boolean => {
    const draft = drafts[row.id];
    if (!draft) return false;
    return (
      (draft.title ?? "") !== (row.title ?? "") ||
      (draft.description ?? "") !== (row.description ?? "") ||
      (draft.ogImage ?? "") !== (row.ogImage ?? "") ||
      (draft.canonical ?? "") !== (row.canonical ?? "")
    );
  };

  const setDraft = <K extends keyof SeoRow>(id: number, key: K, value: SeoRow[K]) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));
  };

  const save = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/seo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title ?? "",
          description: draft.description ?? "",
          ogImage: draft.ogImage ?? "",
          canonical: draft.canonical ?? "",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id,
          text: data.error ?? (locale === "ru" ? "Не удалось сохранить" : "Failed to save"),
          ok: false,
        });
        return;
      }
      setMessage({
        id,
        text: locale === "ru" ? "Сохранено. Применится в течение 60 сек." : "Saved. Live within 60s.",
        ok: true,
      });
      await load();
    } finally {
      setBusy(null);
      setTimeout(() => setMessage((m) => (m && m.id === id ? null : m)), 4000);
    }
  };

  const remove = async (row: SeoRow) => {
    const confirmText =
      locale === "ru"
        ? `Удалить переопределение для ${row.path} (${row.locale})?`
        : `Delete SEO override for ${row.path} (${row.locale})?`;
    if (!confirm(confirmText)) return;
    setBusy(row.id);
    try {
      const res = await fetch(`/api/admin/seo/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id: row.id,
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
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSeo),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(data.error ?? (locale === "ru" ? "Не удалось создать" : "Failed to create"));
        return;
      }
      setNewSeo(EMPTY_NEW_SEO);
      await load();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "SEO переопределения" : "SEO overrides"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Точечно переопределяет title, description, OG-картинку и canonical для конкретного URL и языка. Пустые поля оставляют исходные значения страницы."
            : "Per-page overrides for title, description, OG image, and canonical URL. Empty fields keep the page's built-in defaults."}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Только суперадминистратор может изменять SEO переопределения."
            : "Only superadmins can edit SEO overrides."}
        </div>
      ) : (
        <>
          {/* Existing overrides list */}
          <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                {locale === "ru" ? "Существующие" : "Existing"}
                {rows.length > 0 && ` · ${rows.length}`}
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
            {!error && rows.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {locale === "ru"
                  ? "Переопределений ещё нет. Добавьте ниже, чтобы заменить мета-теги по умолчанию."
                  : "No per-page overrides yet. Add one below to override the default title / description / OG image emitted by the page."}
              </p>
            )}
            {rows.length > 0 && (
              <div className="space-y-2 px-1 pb-1">
                {rows.map((row) => {
                  const draft = drafts[row.id] ?? row;
                  const dirty = isDirty(row);
                  return (
                    <details
                      key={row.id}
                      className="rounded-lg border border-[var(--line)]/60 bg-[var(--bg)] p-3"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 truncate font-mono text-xs text-[var(--ink-2)]">
                          <span className="truncate">{row.path}</span>
                          <span className="inline-flex shrink-0 items-center rounded-md bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                            {row.locale}
                          </span>
                        </span>
                        <span className="truncate text-xs text-[var(--ink-4)]">
                          {row.title ?? (
                            <em>{locale === "ru" ? "(нет заголовка)" : "(no title override)"}</em>
                          )}
                        </span>
                      </summary>
                      <div className="mt-3 grid gap-2">
                        <label
                          className="text-xs text-[var(--ink-4)]"
                          htmlFor={`seo-title-${row.id}`}
                        >
                          {locale === "ru"
                            ? "Title (пусто — оставить значение страницы)"
                            : "Title (leave empty to keep page default)"}
                        </label>
                        <input
                          id={`seo-title-${row.id}`}
                          type="text"
                          value={draft.title ?? ""}
                          onChange={(e) => setDraft(row.id, "title", e.target.value || null)}
                          maxLength={TITLE_MAX}
                          className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                        />
                        <label
                          className="text-xs text-[var(--ink-4)]"
                          htmlFor={`seo-desc-${row.id}`}
                        >
                          {locale === "ru" ? "Описание" : "Description"}
                        </label>
                        <textarea
                          id={`seo-desc-${row.id}`}
                          value={draft.description ?? ""}
                          onChange={(e) =>
                            setDraft(row.id, "description", e.target.value || null)
                          }
                          maxLength={DESCRIPTION_MAX}
                          rows={2}
                          className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                        />
                        <label
                          className="text-xs text-[var(--ink-4)]"
                          htmlFor={`seo-og-${row.id}`}
                        >
                          {locale === "ru" ? "OG-картинка (URL)" : "OG image URL"}
                        </label>
                        <input
                          id={`seo-og-${row.id}`}
                          type="text"
                          value={draft.ogImage ?? ""}
                          onChange={(e) => setDraft(row.id, "ogImage", e.target.value || null)}
                          maxLength={URL_MAX}
                          placeholder="https://renttools.io/og/about.png"
                          className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                        />
                        <label
                          className="text-xs text-[var(--ink-4)]"
                          htmlFor={`seo-canon-${row.id}`}
                        >
                          {locale === "ru" ? "Canonical URL" : "Canonical URL"}
                        </label>
                        <input
                          id={`seo-canon-${row.id}`}
                          type="text"
                          value={draft.canonical ?? ""}
                          onChange={(e) =>
                            setDraft(row.id, "canonical", e.target.value || null)
                          }
                          maxLength={URL_MAX}
                          placeholder="/about or https://renttools.io/about"
                          className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          {message?.id === row.id && (
                            <span
                              className={`text-xs ${
                                message.ok ? "text-emerald-300" : "text-rose-300"
                              }`}
                            >
                              {message.text}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => void remove(row)}
                            disabled={busy === row.id}
                            className="h-8 rounded-md px-3 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                          >
                            {locale === "ru" ? "Удалить" : "Delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void save(row.id)}
                            disabled={!dirty || busy === row.id}
                            className="h-8 rounded-md bg-[var(--m-accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
                          >
                            {busy === row.id
                              ? locale === "ru"
                                ? "Сохр..."
                                : "Saving..."
                              : locale === "ru"
                              ? "Сохранить"
                              : "Save"}
                          </button>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add a new override */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-1 text-sm font-medium text-[var(--ink)]">
              {locale === "ru" ? "Добавить переопределение" : "Add an override"}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {locale === "ru"
                ? "Path — это путь URL (например, /about). Пустые поля оставят значения страницы по умолчанию."
                : "Path is the URL pathname (e.g. /about). Empty fields keep the page's built-in defaults."}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={newSeo.path}
                onChange={(e) => setNewSeo((s) => ({ ...s, path: e.target.value }))}
                placeholder="/about"
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              />
              <select
                value={newSeo.locale}
                onChange={(e) =>
                  setNewSeo((s) => ({ ...s, locale: e.target.value as "en" | "ru" }))
                }
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              >
                <option value="en">en</option>
                <option value="ru">ru</option>
              </select>
            </div>
            <div className="mt-3 grid gap-2">
              <input
                type="text"
                value={newSeo.title}
                onChange={(e) => setNewSeo((s) => ({ ...s, title: e.target.value }))}
                placeholder={
                  locale === "ru" ? `Заголовок (макс. ${TITLE_MAX})` : `Title (max ${TITLE_MAX} chars)`
                }
                maxLength={TITLE_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              />
              <textarea
                value={newSeo.description}
                onChange={(e) => setNewSeo((s) => ({ ...s, description: e.target.value }))}
                placeholder={
                  locale === "ru"
                    ? `Описание (макс. ${DESCRIPTION_MAX})`
                    : `Description (max ${DESCRIPTION_MAX} chars)`
                }
                maxLength={DESCRIPTION_MAX}
                rows={2}
                className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              />
              <input
                type="text"
                value={newSeo.ogImage}
                onChange={(e) => setNewSeo((s) => ({ ...s, ogImage: e.target.value }))}
                placeholder={locale === "ru" ? "OG-картинка (URL)" : "OG image URL"}
                maxLength={URL_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              />
              <input
                type="text"
                value={newSeo.canonical}
                onChange={(e) => setNewSeo((s) => ({ ...s, canonical: e.target.value }))}
                placeholder={locale === "ru" ? "Canonical URL (опционально)" : "Canonical URL (optional)"}
                maxLength={URL_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              />
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              {createError && <span className="text-xs text-rose-300">{createError}</span>}
              <button
                type="button"
                onClick={() => void create()}
                disabled={creating || newSeo.path.trim().length === 0}
                className="h-9 rounded-md bg-[var(--m-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
              >
                {creating
                  ? locale === "ru"
                    ? "Добавление..."
                    : "Adding..."
                  : locale === "ru"
                  ? "Добавить переопределение"
                  : "Add override"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
