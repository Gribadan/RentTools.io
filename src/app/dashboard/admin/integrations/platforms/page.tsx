"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loading: string;
  notSuperadmin: string;
  existingHeader: string;
  refreshing: string;
  refresh: string;
  loadFailed: (status: number) => string;
  loadFailedShort: string;
  empty: string;
  customBadge: string;
  saveFailed: string;
  saved: string;
  failedDelete: string;
  failedCreate: string;
  confirmDelete: (name: string, slug: string) => string;
  colHeaderName: string;
  colHeaderColor: string;
  colHeaderSort: string;
  colHeaderStatus: string;
  colHeaderActions: string;
  enabled: string;
  disabled: string;
  save: string;
  delete: string;
  addCustomTitle: string;
  addCustomDescription: string;
  displayName: string;
  color: string;
  sort: string;
  adding: string;
  add: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Calendar platforms",
    description:
      "Booking platform registry. Colors and sort order surface in the calendar and the dashboard. Slug is baked into the outbound iCal feed URL (/for-{slug}.ics) and cannot be changed after creation.",
    loading: "Loading...",
    notSuperadmin: "Only superadmins can edit the platform registry.",
    existingHeader: "Existing",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    loadFailed: (status) => `Failed to load platforms (${status})`,
    loadFailedShort: "Failed to load platforms",
    empty: "No platforms.",
    customBadge: "custom",
    saveFailed: "Failed to save",
    saved: "Saved. Live within 60s.",
    failedDelete: "Failed to delete",
    failedCreate: "Failed to create",
    confirmDelete: (name, slug) => `Delete platform "${name}" (${slug})? This can't be undone.`,
    colHeaderName: "Name",
    colHeaderColor: "Color",
    colHeaderSort: "Sort",
    colHeaderStatus: "Status",
    colHeaderActions: "Actions",
    enabled: "Enabled",
    disabled: "Disabled",
    save: "Save",
    delete: "Delete",
    addCustomTitle: "Add a custom platform",
    addCustomDescription:
      "Use this for platforms not in the built-in list. The slug is permanent — it's baked into the outbound iCal feed URL /for-{slug}.ics.",
    displayName: "Display name",
    color: "Color",
    sort: "Sort",
    adding: "Adding...",
    add: "Add",
  },
  ru: {
    title: "Платформы (календарь)",
    description:
      "Реестр платформ бронирования. Цвета и порядок отображаются в календаре и в дашборде. Slug встраивается в URL исходящего iCal feed (/for-{slug}.ics) и не может быть изменён после создания.",
    loading: "Загрузка...",
    notSuperadmin: "Только суперадминистратор может изменять реестр платформ.",
    existingHeader: "Существующие",
    refreshing: "Обновляется...",
    refresh: "Обновить",
    loadFailed: (status) => `Не удалось загрузить платформы (${status})`,
    loadFailedShort: "Не удалось загрузить платформы",
    empty: "Нет платформ.",
    customBadge: "польз.",
    saveFailed: "Не удалось сохранить",
    saved: "Сохранено. Применится в течение 60 сек.",
    failedDelete: "Не удалось удалить",
    failedCreate: "Не удалось создать",
    confirmDelete: (name, slug) => `Удалить платформу "${name}" (${slug})? Это действие нельзя отменить.`,
    colHeaderName: "Название",
    colHeaderColor: "Цвет",
    colHeaderSort: "Порядок",
    colHeaderStatus: "Статус",
    colHeaderActions: "Действия",
    enabled: "Включено",
    disabled: "Отключено",
    save: "Сохр.",
    delete: "Удалить",
    addCustomTitle: "Добавить пользовательскую платформу",
    addCustomDescription:
      "Для платформ, которых нет во встроенном списке. Slug нельзя изменить — он встраивается в URL исходящего iCal feed /for-{slug}.ics.",
    displayName: "Название",
    color: "Цвет",
    sort: "Порядок",
    adding: "Добавление...",
    add: "Добавить",
  },
  de: {
    title: "Kalenderplattformen",
    description:
      "Registry der Buchungsplattformen. Farben und Sortierung erscheinen im Kalender und im Dashboard. Der Slug ist in die ausgehende iCal-Feed-URL (/for-{slug}.ics) eingebettet und kann nach dem Erstellen nicht geändert werden.",
    loading: "Wird geladen...",
    notSuperadmin: "Nur Superadmins können die Plattform-Registry bearbeiten.",
    existingHeader: "Vorhanden",
    refreshing: "Wird aktualisiert...",
    refresh: "Aktualisieren",
    loadFailed: (status) => `Plattformen konnten nicht geladen werden (${status})`,
    loadFailedShort: "Plattformen konnten nicht geladen werden",
    empty: "Keine Plattformen.",
    customBadge: "eigen",
    saveFailed: "Speichern fehlgeschlagen",
    saved: "Gespeichert. Innerhalb von 60 s aktiv.",
    failedDelete: "Löschen fehlgeschlagen",
    failedCreate: "Erstellen fehlgeschlagen",
    confirmDelete: (name, slug) => `Plattform „${name}" (${slug}) löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    colHeaderName: "Name",
    colHeaderColor: "Farbe",
    colHeaderSort: "Sortierung",
    colHeaderStatus: "Status",
    colHeaderActions: "Aktionen",
    enabled: "Aktiviert",
    disabled: "Deaktiviert",
    save: "Speich.",
    delete: "Löschen",
    addCustomTitle: "Eigene Plattform hinzufügen",
    addCustomDescription:
      "Für Plattformen, die nicht in der integrierten Liste enthalten sind. Der Slug ist dauerhaft — er wird in die ausgehende iCal-Feed-URL /for-{slug}.ics eingebettet.",
    displayName: "Anzeigename",
    color: "Farbe",
    sort: "Sortierung",
    adding: "Wird hinzugefügt...",
    add: "Hinzufügen",
  },
  fr: {
    title: "Plateformes (calendrier)",
    description:
      "Registre des plateformes de réservation. Les couleurs et l'ordre apparaissent dans le calendrier et dans le dashboard. Le slug est intégré à l'URL du feed iCal sortant (/for-{slug}.ics) et ne peut plus être modifié après la création.",
    loading: "Chargement...",
    notSuperadmin: "Seuls les superadmins peuvent modifier le registre des plateformes.",
    existingHeader: "Existantes",
    refreshing: "Actualisation...",
    refresh: "Actualiser",
    loadFailed: (status) => `Échec du chargement des plateformes (${status})`,
    loadFailedShort: "Échec du chargement des plateformes",
    empty: "Aucune plateforme.",
    customBadge: "perso",
    saveFailed: "Échec de l'enregistrement",
    saved: "Enregistré. Actif sous 60 s.",
    failedDelete: "Échec de la suppression",
    failedCreate: "Échec de la création",
    confirmDelete: (name, slug) => `Supprimer la plateforme « ${name} » (${slug}) ? Action irréversible.`,
    colHeaderName: "Nom",
    colHeaderColor: "Couleur",
    colHeaderSort: "Ordre",
    colHeaderStatus: "Statut",
    colHeaderActions: "Actions",
    enabled: "Activée",
    disabled: "Désactivée",
    save: "Enreg.",
    delete: "Supprimer",
    addCustomTitle: "Ajouter une plateforme personnalisée",
    addCustomDescription:
      "À utiliser pour les plateformes absentes de la liste intégrée. Le slug est permanent — il est intégré à l'URL du feed iCal sortant /for-{slug}.ics.",
    displayName: "Nom affiché",
    color: "Couleur",
    sort: "Ordre",
    adding: "Ajout...",
    add: "Ajouter",
  },
};

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
  const t = COPY[locale];
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
        setError(t.loadFailed(res.status));
        return;
      }
      const data = (await res.json()) as PlatformRow[];
      setRows(data);
      const next: Record<string, PlatformRow> = {};
      for (const p of data) next[p.slug] = { ...p };
      setDrafts(next);
    } catch {
      setError(t.loadFailedShort);
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
          text: data.error ?? t.saveFailed,
          ok: false,
        });
        return;
      }
      setMessage({
        slug,
        text: t.saved,
        ok: true,
      });
      await load();
    } finally {
      setBusy(null);
      setTimeout(() => setMessage((m) => (m && m.slug === slug ? null : m)), 4000);
    }
  };

  const remove = async (p: PlatformRow) => {
    if (!confirm(t.confirmDelete(p.displayName, p.slug))) return;
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
          text: data.error ?? t.failedDelete,
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
        setCreateError(data.error ?? t.failedCreate);
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
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                {t.existingHeader}
                {rows.length > 0 && ` · ${rows.length}`}
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

            {error && <p className="px-4 pb-3 text-xs text-rose-300">{error}</p>}
            {!error && rows.length === 0 && !loading && (
              <p className="px-4 pb-3 text-xs text-[var(--ink-4)]">
                {t.empty}
              </p>
            )}
            {rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-t border-[var(--line)] text-sm">
                  <thead className="bg-[var(--bg-3)]/40 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Slug</th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.colHeaderName}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.colHeaderColor}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {t.colHeaderSort}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.colHeaderStatus}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {t.colHeaderActions}
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
                                {t.customBadge}
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
                                {t.enabled}
                              </option>
                              <option value="false">
                                {t.disabled}
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
                                {busy === p.slug ? "…" : t.save}
                              </button>
                              {p.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => void remove(p)}
                                  disabled={busy === p.slug}
                                  className="h-7 rounded-md px-2 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                                >
                                  {t.delete}
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
              {t.addCustomTitle}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {t.addCustomDescription}
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
                  {t.displayName}
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
                  {t.color}
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
                  {t.sort}
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
                  {creating ? t.adding : t.add}
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
