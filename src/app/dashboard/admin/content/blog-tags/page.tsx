"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loading: string;
  notSuperadmin: string;
  tagsHeader: string;
  refreshing: string;
  refresh: string;
  loadFailed: (status: number) => string;
  loadFailedShort: string;
  empty: string;
  failedSave: string;
  savedWithRewrite: (count: number) => string;
  saved: string;
  failedDelete: string;
  failedCreate: string;
  confirmDeleteWithPosts: (name: string, l: string, count: number) => string;
  confirmDelete: (name: string, l: string) => string;
  pickBoth: string;
  mustDiffer: string;
  notFound: string;
  failedMerge: string;
  confirmMerge: (sName: string, sLocale: string, dName: string, dLocale: string, count: number) => string;
  colDisplayName: string;
  colSlug: string;
  colLocale: string;
  colPosts: string;
  colActions: string;
  saveShort: string;
  deleteShort: string;
  newTagTitle: string;
  newTagNamePlaceholder: string;
  newTagSlugPlaceholder: string;
  adding: string;
  add: string;
  mergeTitle: string;
  mergeDescription: string;
  mergeSourcePlaceholder: string;
  mergeDestPlaceholder: string;
  merging: string;
  mergeButton: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Blog tags",
    description:
      "Rename, delete, and merge tags. Renaming the slug rewrites every post that references it; merging moves all source-tagged posts onto the destination tag.",
    loading: "Loading...",
    notSuperadmin: "Only superadmins can manage blog tags.",
    tagsHeader: "Tags",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    loadFailed: (status) => `Failed to load tags (${status})`,
    loadFailedShort: "Failed to load tags",
    empty: "No tags yet. Add one with the form below.",
    failedSave: "Failed to save",
    savedWithRewrite: (count) => `Saved. Rewrote ${count} post(s).`,
    saved: "Saved.",
    failedDelete: "Failed to delete",
    failedCreate: "Failed to create",
    confirmDeleteWithPosts: (name, l, count) =>
      `Delete tag "${name}" (${l})? It is used by ${count} post(s); the slug will be removed from each but the posts will not be deleted.`,
    confirmDelete: (name, l) => `Delete tag "${name}" (${l})?`,
    pickBoth: "Pick both a source and a destination tag",
    mustDiffer: "Source and destination must differ",
    notFound: "Source or destination not found",
    failedMerge: "Merge failed",
    confirmMerge: (sName, sLocale, dName, dLocale, count) =>
      `Merge "${sName}" (${sLocale}) into "${dName}" (${dLocale})? Source tag will be deleted; ${count} post(s) will be rewritten.`,
    colDisplayName: "Display name",
    colSlug: "Slug",
    colLocale: "Locale",
    colPosts: "Posts",
    colActions: "Actions",
    saveShort: "Save",
    deleteShort: "Delete",
    newTagTitle: "New tag",
    newTagNamePlaceholder: "Display name (e.g. Hosting tips)",
    newTagSlugPlaceholder: "slug (optional)",
    adding: "Adding…",
    add: "Add",
    mergeTitle: "Merge tags",
    mergeDescription:
      "Move every post from a source tag onto a destination tag, then delete the source. Both tags must share a locale.",
    mergeSourcePlaceholder: "Source tag…",
    mergeDestPlaceholder: "Destination tag…",
    merging: "Merging…",
    mergeButton: "Merge",
  },
  ru: {
    title: "Теги блога",
    description:
      "Переименование, удаление и объединение тегов. При переименовании slug автоматически обновляется во всех статьях, использующих тег.",
    loading: "Загрузка...",
    notSuperadmin: "Только суперадминистратор может управлять тегами.",
    tagsHeader: "Теги",
    refreshing: "Обновляется...",
    refresh: "Обновить",
    loadFailed: (status) => `Не удалось загрузить теги (${status})`,
    loadFailedShort: "Не удалось загрузить теги",
    empty: "Тегов ещё нет. Добавьте ниже.",
    failedSave: "Не удалось сохранить",
    savedWithRewrite: (count) => `Сохранено. Переписано ${count} статей.`,
    saved: "Сохранено.",
    failedDelete: "Не удалось удалить",
    failedCreate: "Не удалось создать",
    confirmDeleteWithPosts: (name, l, count) =>
      `Удалить тег «${name}» (${l})? Используется в ${count} статьях; будет убран с каждой, статьи останутся.`,
    confirmDelete: (name, l) => `Удалить тег «${name}» (${l})?`,
    pickBoth: "Выберите источник и назначение",
    mustDiffer: "Источник и назначение должны отличаться",
    notFound: "Тег не найден",
    failedMerge: "Не удалось объединить",
    confirmMerge: (sName, sLocale, dName, dLocale, count) =>
      `Объединить «${sName}» (${sLocale}) в «${dName}» (${dLocale})? Источник будет удалён; ${count} статей будет переписано.`,
    colDisplayName: "Название",
    colSlug: "Слаг",
    colLocale: "Язык",
    colPosts: "Статей",
    colActions: "Действия",
    saveShort: "Сохр.",
    deleteShort: "Удал.",
    newTagTitle: "Новый тег",
    newTagNamePlaceholder: "Название (например, Советы хостам)",
    newTagSlugPlaceholder: "слаг (необязательно)",
    adding: "Добавляется…",
    add: "Добавить",
    mergeTitle: "Объединить теги",
    mergeDescription:
      "Перенести все статьи с тега-источника на тег-назначение, потом удалить источник. Оба тега должны быть на одном языке.",
    mergeSourcePlaceholder: "Источник…",
    mergeDestPlaceholder: "Назначение…",
    merging: "Объединение…",
    mergeButton: "Объединить",
  },
};

// RT-25.9 tick 22 — Blog tags sub-route at
// /dashboard/admin/content/blog-tags. Third slice off the long-scroll
// AdminPanel "Admin · Blog" section. Inline-editable table (rename
// slug + display name with rewrite count), per-row delete (warns when
// posts reference the tag), create form, and merge-tags flow that
// moves all source posts onto the destination tag and deletes the
// source. Reuses /api/admin/blog-tags GET/POST,
// /api/admin/blog-tags/[id] PATCH/DELETE, /api/admin/blog-tags/merge —
// all already superadmin-gated. Native dark-palette tokens replace
// the legacy shadcn primitives. AdminPanel still renders its copy
// until the SettingsPanel removal sweep.

interface BlogTagRow {
  id: number;
  slug: string;
  displayName: string;
  locale: string;
  postCount: number;
  createdAt: string;
}

interface NewTagDraft {
  slug: string;
  displayName: string;
  locale: "en" | "ru";
}

interface MeResponse {
  user?: { role: string } | null;
}

const EMPTY_NEW_TAG: NewTagDraft = { slug: "", displayName: "", locale: "en" };

const SLUG_MAX = 60;
const NAME_MAX = 80;

export default function AdminBlogTagsPage() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [tags, setTags] = useState<BlogTagRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { slug: string; displayName: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [newTag, setNewTag] = useState<NewTagDraft>(EMPTY_NEW_TAG);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState<string>("");
  const [mergeDestId, setMergeDestId] = useState<string>("");
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

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
      const res = await fetch("/api/admin/blog-tags");
      if (!res.ok) {
        setError(t.loadFailed(res.status));
        return;
      }
      const data = (await res.json()) as BlogTagRow[];
      setTags(data);
      const next: Record<number, { slug: string; displayName: string }> = {};
      for (const tag of data) next[tag.id] = { slug: tag.slug, displayName: tag.displayName };
      setDrafts(next);
    } catch {
      setError(t.loadFailedShort);
    } finally {
      setLoading(false);
    }
  };

  const isDirty = (row: BlogTagRow): boolean => {
    const draft = drafts[row.id];
    if (!draft) return false;
    return draft.slug !== row.slug || draft.displayName !== row.displayName;
  };

  const setDraft = (id: number, key: "slug" | "displayName", value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));
  };

  const save = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/blog-tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draft.slug, displayName: draft.displayName }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id,
          text: data.error ?? t.failedSave,
          ok: false,
        });
        return;
      }
      const data = (await res.json()) as { rewrittenPosts: number };
      setMessage({
        id,
        text: data.rewrittenPosts > 0 ? t.savedWithRewrite(data.rewrittenPosts) : t.saved,
        ok: true,
      });
      await load();
    } finally {
      setBusy(null);
      setTimeout(() => setMessage((m) => (m && m.id === id ? null : m)), 4000);
    }
  };

  const remove = async (row: BlogTagRow) => {
    const warn =
      row.postCount > 0
        ? t.confirmDeleteWithPosts(row.displayName, row.locale, row.postCount)
        : t.confirmDelete(row.displayName, row.locale);
    if (!confirm(warn)) return;
    setBusy(row.id);
    try {
      const res = await fetch(`/api/admin/blog-tags/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id: row.id,
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
      const res = await fetch("/api/admin/blog-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(data.error ?? t.failedCreate);
        return;
      }
      setNewTag(EMPTY_NEW_TAG);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const merge = async () => {
    const sourceId = Number(mergeSourceId);
    const destId = Number(mergeDestId);
    if (!Number.isInteger(sourceId) || sourceId <= 0 || !Number.isInteger(destId) || destId <= 0) {
      setMergeError(t.pickBoth);
      return;
    }
    if (sourceId === destId) {
      setMergeError(t.mustDiffer);
      return;
    }
    const source = tags.find((tag) => tag.id === sourceId);
    const dest = tags.find((tag) => tag.id === destId);
    if (!source || !dest) {
      setMergeError(t.notFound);
      return;
    }
    if (
      !confirm(
        t.confirmMerge(source.displayName, source.locale, dest.displayName, dest.locale, source.postCount),
      )
    ) {
      return;
    }
    setMerging(true);
    setMergeError(null);
    try {
      const res = await fetch("/api/admin/blog-tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, destId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMergeError(data.error ?? t.failedMerge);
        return;
      }
      setMergeSourceId("");
      setMergeDestId("");
      await load();
    } finally {
      setMerging(false);
    }
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
        <>
          {/* Tag list / inline editor */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                {t.tagsHeader}
                {tags.length > 0 && ` · ${tags.length}`}
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

            {error && <p className="px-3 py-2 text-xs text-rose-300">{error}</p>}
            {!error && tags.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {t.empty}
              </p>
            )}

            {tags.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)]/50 text-left text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                      <th className="px-3 py-2 font-medium">
                        {t.colDisplayName}
                      </th>
                      <th className="px-3 py-2 font-medium">{t.colSlug}</th>
                      <th className="px-3 py-2 font-medium">{t.colLocale}</th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.colPosts}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.colActions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map((tag) => {
                      const draft = drafts[tag.id] ?? { slug: tag.slug, displayName: tag.displayName };
                      const dirty = isDirty(tag);
                      return (
                        <tr key={tag.id} className="border-b border-[var(--line)]/30 last:border-b-0">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={draft.displayName}
                              onChange={(e) => setDraft(tag.id, "displayName", e.target.value)}
                              maxLength={NAME_MAX}
                              className="h-8 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={draft.slug}
                              onChange={(e) => setDraft(tag.id, "slug", e.target.value)}
                              maxLength={SLUG_MAX}
                              className="h-8 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 font-mono text-[11px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center rounded-md bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                              {tag.locale}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-2)]">
                            {tag.postCount}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => void save(tag.id)}
                                disabled={busy === tag.id || !dirty}
                                className="rounded-md bg-[var(--ink)] px-2.5 py-1 text-[11px] font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
                              >
                                {t.saveShort}
                              </button>
                              <button
                                type="button"
                                onClick={() => void remove(tag)}
                                disabled={busy === tag.id}
                                className="rounded-md px-2 py-1 text-[11px] text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                              >
                                {t.deleteShort}
                              </button>
                            </div>
                            {message?.id === tag.id && (
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

          {/* New tag */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-3 text-sm font-medium text-[var(--ink)]">
              {t.newTagTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px_auto]">
              <input
                type="text"
                value={newTag.displayName}
                onChange={(e) => setNewTag((s) => ({ ...s, displayName: e.target.value }))}
                placeholder={t.newTagNamePlaceholder}
                maxLength={NAME_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
              <input
                type="text"
                value={newTag.slug}
                onChange={(e) => setNewTag((s) => ({ ...s, slug: e.target.value }))}
                placeholder={t.newTagSlugPlaceholder}
                maxLength={SLUG_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
              <select
                value={newTag.locale}
                onChange={(e) => setNewTag((s) => ({ ...s, locale: e.target.value as "en" | "ru" }))}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              >
                <option value="en">en</option>
                <option value="ru">ru</option>
              </select>
              <button
                type="button"
                onClick={() => void create()}
                disabled={creating || newTag.displayName.trim().length === 0}
                className="h-9 rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {creating ? t.adding : t.add}
              </button>
            </div>
            {createError && <p className="mt-2 text-xs text-rose-300">{createError}</p>}
          </div>

          {/* Merge tags */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-1 text-sm font-medium text-[var(--ink)]">
              {t.mergeTitle}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {t.mergeDescription}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              >
                <option value="">{t.mergeSourcePlaceholder}</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.displayName} · {tag.locale} · {tag.postCount}
                  </option>
                ))}
              </select>
              <select
                value={mergeDestId}
                onChange={(e) => setMergeDestId(e.target.value)}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              >
                <option value="">{t.mergeDestPlaceholder}</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.displayName} · {tag.locale} · {tag.postCount}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void merge()}
                disabled={merging || !mergeSourceId || !mergeDestId}
                className="h-9 rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {merging ? t.merging : t.mergeButton}
              </button>
            </div>
            {mergeError && <p className="mt-2 text-xs text-rose-300">{mergeError}</p>}
          </div>
        </>
      )}
    </div>
  );
}
