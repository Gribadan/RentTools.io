"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 14 — Calendar platforms sub-route at
// /dashboard/admin/integrations/platforms. Lifts the "Admin · Platforms"
// section out of admin-panel.tsx (lines ~1286-1517, ~233 lines) into
// its own deep-linkable surface. Reuses /api/admin/platforms GET/POST
// and /api/admin/platforms/[slug] PUT/DELETE — both already
// superadmin-gated. Non-superadmins see a permission notice.
// Native dark-palette tokens (matches users + site-settings + seo
// migrations); legacy section's shadcn Table + Button + Input
// primitives are dropped. SettingsPanel still keeps its copy until
// the removal sweep ships.

interface PlatformRow {
  id: number;
  slug: string;
  displayName: string;
  color: string;
  iconUrl: string | null;
  defaultBufferBefore: number;
  defaultBufferAfter: number;
  importInstructionsKey: string | null;
  exportInstructionsKey: string | null;
  isCustom: boolean;
  enabled: boolean;
  sortOrder: number;
}

interface NewDraft {
  slug: string;
  displayName: string;
  color: string;
  sortOrder: string;
}

interface MeResponse {
  user?: { role: string } | null;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const EMPTY_NEW: NewDraft = {
  slug: "",
  displayName: "",
  color: "#6B7280",
  sortOrder: "150",
};

export default function AdminPlatformsPage() {
  const { locale } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [rows, setRows] = useState<PlatformRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PlatformRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ slug: string; text: string; ok: boolean } | null>(null);
  const [newRow, setNewRow] = useState<NewDraft>(EMPTY_NEW);
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
      const res = await fetch("/api/admin/platforms");
      if (!res.ok) {
        setError(
          locale === "ru"
            ? `Не удалось загрузить платформы (${res.status})`
            : `Failed to load platforms (${res.status})`,
        );
        return;
      }
      const data = (await res.json()) as PlatformRow[];
      setRows(data);
      const next: Record<string, PlatformRow> = {};
      for (const p of data) next[p.slug] = { ...p };
      setDrafts(next);
    } catch {
      setError(
        locale === "ru" ? "Не удалось загрузить платформы" : "Failed to load platforms",
      );
    } finally {
      setLoading(false);
    }
  };

  const isDirty = (p: PlatformRow): boolean => {
    const draft = drafts[p.slug];
    if (!draft) return false;
    return (
      draft.displayName !== p.displayName ||
      draft.color.toUpperCase() !== p.color.toUpperCase() ||
      draft.sortOrder !== p.sortOrder ||
      draft.enabled !== p.enabled
    );
  };

  const setDraft = <K extends keyof PlatformRow>(slug: string, key: K, value: PlatformRow[K]) => {
    setDrafts((d) => ({ ...d, [slug]: { ...d[slug], [key]: value } }));
  };

  const save = async (slug: string) => {
    const draft = drafts[slug];
    if (!draft) return;
    setBusy(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/platforms/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draft.displayName,
          color: draft.color,
          sortOrder: draft.sortOrder,
          enabled: draft.enabled,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          slug,
          text: data.error ?? (locale === "ru" ? "Не удалось сохранить" : "Failed to save"),
          ok: false,
        });
        return;
      }
      setMessage({
        slug,
        text: locale === "ru" ? "Сохранено. Применится в течение 60 сек." : "Saved. Live within 60s.",
        ok: true,
      });
      await load();
    } finally {
      setBusy(null);
      setTimeout(() => setMessage((m) => (m && m.slug === slug ? null : m)), 4000);
    }
  };

  const remove = async (p: PlatformRow) => {
    const text =
      locale === "ru"
        ? `Удалить платформу "${p.displayName}" (${p.slug})? Это действие нельзя отменить.`
        : `Delete platform "${p.displayName}" (${p.slug})? This can't be undone.`;
    if (!confirm(text)) return;
    setBusy(p.slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/platforms/${encodeURIComponent(p.slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          slug: p.slug,
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
      const sortOrderNum = Number(newRow.sortOrder);
      const res = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newRow.slug,
          displayName: newRow.displayName,
          color: newRow.color,
          sortOrder: Number.isFinite(sortOrderNum) ? sortOrderNum : 150,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(data.error ?? (locale === "ru" ? "Не удалось создать" : "Failed to create"));
        return;
      }
      setNewRow(EMPTY_NEW);
      await load();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Платформы (календарь)" : "Calendar platforms"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Реестр платформ бронирования. Цвета и порядок отображаются в календаре и в дашборде. Slug встраивается в URL исходящего iCal feed (/for-{slug}.ics) и не может быть изменён после создания."
            : "Booking platform registry. Colors and sort order surface in the calendar and the dashboard. Slug is baked into the outbound iCal feed URL (/for-{slug}.ics) and cannot be changed after creation."}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Только суперадминистратор может изменять реестр платформ."
            : "Only superadmins can edit the platform registry."}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
            <div className="flex items-center justify-between px-4 py-3">
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

            {error && <p className="px-4 pb-3 text-xs text-rose-300">{error}</p>}
            {!error && rows.length === 0 && !loading && (
              <p className="px-4 pb-3 text-xs text-[var(--ink-4)]">
                {locale === "ru" ? "Нет платформ." : "No platforms."}
              </p>
            )}
            {rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-t border-[var(--line)] text-sm">
                  <thead className="bg-[var(--bg-3)]/40 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Slug</th>
                      <th className="px-4 py-2 text-left font-medium">
                        {locale === "ru" ? "Название" : "Name"}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {locale === "ru" ? "Цвет" : "Color"}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {locale === "ru" ? "Порядок" : "Sort"}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {locale === "ru" ? "Статус" : "Status"}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {locale === "ru" ? "Действия" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]/50">
                    {rows.map((p) => {
                      const draft = drafts[p.slug] ?? p;
                      const dirty = isDirty(p);
                      const colorValid = HEX_COLOR_RE.test(draft.color);
                      const nameValid =
                        draft.displayName.trim().length > 0 && draft.displayName.length <= 64;
                      const canSave = dirty && colorValid && nameValid;
                      return (
                        <tr key={p.slug} className={!draft.enabled ? "opacity-60" : ""}>
                          <td className="px-4 py-3 font-mono text-xs text-[var(--ink-3)]">
                            {p.slug}
                            {p.isCustom && (
                              <span className="ml-2 inline-flex items-center rounded-md bg-[var(--m-accent)]/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--m-accent)]">
                                {locale === "ru" ? "польз." : "custom"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={draft.displayName}
                              onChange={(e) => setDraft(p.slug, "displayName", e.target.value)}
                              maxLength={64}
                              className="h-8 w-40 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={colorValid ? draft.color : "#6B7280"}
                                onChange={(e) =>
                                  setDraft(p.slug, "color", e.target.value.toUpperCase())
                                }
                                className="h-8 w-8 cursor-pointer rounded-md border border-[var(--line-2)] bg-transparent"
                                aria-label={`Color for ${p.displayName}`}
                              />
                              <input
                                type="text"
                                value={draft.color}
                                onChange={(e) => setDraft(p.slug, "color", e.target.value)}
                                maxLength={7}
                                className="h-8 w-24 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 font-mono text-xs uppercase text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              value={String(draft.sortOrder)}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isFinite(n) && Number.isInteger(n)) {
                                  setDraft(p.slug, "sortOrder", n);
                                }
                              }}
                              className="ml-auto h-8 w-20 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-right text-sm tabular-nums text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={draft.enabled ? "true" : "false"}
                              onChange={(e) =>
                                setDraft(p.slug, "enabled", e.target.value === "true")
                              }
                              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                            >
                              <option value="true">
                                {locale === "ru" ? "Включено" : "Enabled"}
                              </option>
                              <option value="false">
                                {locale === "ru" ? "Отключено" : "Disabled"}
                              </option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void save(p.slug)}
                                disabled={!canSave || busy === p.slug}
                                className="h-7 rounded-md bg-[var(--m-accent)] px-2.5 text-xs font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
                              >
                                {busy === p.slug ? "…" : locale === "ru" ? "Сохр." : "Save"}
                              </button>
                              {p.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => void remove(p)}
                                  disabled={busy === p.slug}
                                  className="h-7 rounded-md px-2 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                                >
                                  {locale === "ru" ? "Удалить" : "Delete"}
                                </button>
                              )}
                            </div>
                            {message?.slug === p.slug && (
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add a custom platform */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-1 text-sm font-medium text-[var(--ink)]">
              {locale === "ru" ? "Добавить пользовательскую платформу" : "Add a custom platform"}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {locale === "ru"
                ? "Для платформ, которых нет во встроенном списке. Slug нельзя изменить — он встраивается в URL исходящего iCal feed /for-{slug}.ics."
                : "Use this for platforms not in the built-in list. The slug is permanent — it's baked into the outbound iCal feed URL /for-{slug}.ics."}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
              <div>
                <label className="mb-1 block text-xs text-[var(--ink-4)]" htmlFor="np-slug">
                  Slug
                </label>
                <input
                  id="np-slug"
                  type="text"
                  value={newRow.slug}
                  onChange={(e) => setNewRow((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="my-platform"
                  className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--ink-4)]" htmlFor="np-name">
                  {locale === "ru" ? "Название" : "Display name"}
                </label>
                <input
                  id="np-name"
                  type="text"
                  value={newRow.displayName}
                  onChange={(e) => setNewRow((s) => ({ ...s, displayName: e.target.value }))}
                  placeholder="My Platform"
                  className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--ink-4)]" htmlFor="np-color">
                  {locale === "ru" ? "Цвет" : "Color"}
                </label>
                <input
                  id="np-color"
                  type="color"
                  value={HEX_COLOR_RE.test(newRow.color) ? newRow.color : "#6B7280"}
                  onChange={(e) =>
                    setNewRow((s) => ({ ...s, color: e.target.value.toUpperCase() }))
                  }
                  className="h-9 w-16 cursor-pointer rounded-md border border-[var(--line-2)] bg-transparent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--ink-4)]" htmlFor="np-sort">
                  {locale === "ru" ? "Порядок" : "Sort"}
                </label>
                <input
                  id="np-sort"
                  type="number"
                  value={newRow.sortOrder}
                  onChange={(e) => setNewRow((s) => ({ ...s, sortOrder: e.target.value }))}
                  className="h-9 w-20 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm tabular-nums text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void create()}
                  disabled={
                    creating ||
                    newRow.slug.trim().length === 0 ||
                    newRow.displayName.trim().length === 0
                  }
                  className="h-9 rounded-md bg-[var(--m-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
                >
                  {creating
                    ? locale === "ru"
                      ? "Добавление..."
                      : "Adding..."
                    : locale === "ru"
                    ? "Добавить"
                    : "Add"}
                </button>
              </div>
            </div>
            {createError && <p className="mt-2 text-xs text-rose-300">{createError}</p>}
          </div>
        </>
      )}
    </div>
  );
}
