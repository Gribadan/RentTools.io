"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

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
        setError(
          locale === "ru" ? `Не удалось загрузить теги (${res.status})` : `Failed to load tags (${res.status})`,
        );
        return;
      }
      const data = (await res.json()) as BlogTagRow[];
      setTags(data);
      const next: Record<number, { slug: string; displayName: string }> = {};
      for (const t of data) next[t.id] = { slug: t.slug, displayName: t.displayName };
      setDrafts(next);
    } catch {
      setError(locale === "ru" ? "Не удалось загрузить теги" : "Failed to load tags");
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
          text: data.error ?? (locale === "ru" ? "Не удалось сохранить" : "Failed to save"),
          ok: false,
        });
        return;
      }
      const data = (await res.json()) as { rewrittenPosts: number };
      setMessage({
        id,
        text:
          data.rewrittenPosts > 0
            ? locale === "ru"
              ? `Сохранено. Переписано ${data.rewrittenPosts} статей.`
              : `Saved. Rewrote ${data.rewrittenPosts} post(s).`
            : locale === "ru"
              ? "Сохранено."
              : "Saved.",
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
        ? locale === "ru"
          ? `Удалить тег «${row.displayName}» (${row.locale})? Используется в ${row.postCount} статьях; будет убран с каждой, статьи останутся.`
          : `Delete tag "${row.displayName}" (${row.locale})? It is used by ${row.postCount} post(s); the slug will be removed from each but the posts will not be deleted.`
        : locale === "ru"
          ? `Удалить тег «${row.displayName}» (${row.locale})?`
          : `Delete tag "${row.displayName}" (${row.locale})?`;
    if (!confirm(warn)) return;
    setBusy(row.id);
    try {
      const res = await fetch(`/api/admin/blog-tags/${row.id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/blog-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(
          data.error ?? (locale === "ru" ? "Не удалось создать" : "Failed to create"),
        );
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
      setMergeError(
        locale === "ru" ? "Выберите источник и назначение" : "Pick both a source and a destination tag",
      );
      return;
    }
    if (sourceId === destId) {
      setMergeError(
        locale === "ru" ? "Источник и назначение должны отличаться" : "Source and destination must differ",
      );
      return;
    }
    const source = tags.find((t) => t.id === sourceId);
    const dest = tags.find((t) => t.id === destId);
    if (!source || !dest) {
      setMergeError(locale === "ru" ? "Тег не найден" : "Source or destination not found");
      return;
    }
    const confirmText =
      locale === "ru"
        ? `Объединить «${source.displayName}» (${source.locale}) в «${dest.displayName}» (${dest.locale})? Источник будет удалён; ${source.postCount} статей будет переписано.`
        : `Merge "${source.displayName}" (${source.locale}) into "${dest.displayName}" (${dest.locale})? Source tag will be deleted; ${source.postCount} post(s) will be rewritten.`;
    if (!confirm(confirmText)) return;
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
        setMergeError(data.error ?? (locale === "ru" ? "Не удалось объединить" : "Merge failed"));
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
          {locale === "ru" ? "Теги блога" : "Blog tags"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Переименование, удаление и объединение тегов. При переименовании slug автоматически обновляется во всех статьях, использующих тег."
            : "Rename, delete, and merge tags. Renaming the slug rewrites every post that references it; merging moves all source-tagged posts onto the destination tag."}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Только суперадминистратор может управлять тегами."
            : "Only superadmins can manage blog tags."}
        </div>
      ) : (
        <>
          {/* Tag list / inline editor */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                {locale === "ru" ? "Теги" : "Tags"}
                {tags.length > 0 && ` · ${tags.length}`}
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
            {!error && tags.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {locale === "ru" ? "Тегов ещё нет. Добавьте ниже." : "No tags yet. Add one with the form below."}
              </p>
            )}

            {tags.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)]/50 text-left text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                      <th className="px-3 py-2 font-medium">
                        {locale === "ru" ? "Название" : "Display name"}
                      </th>
                      <th className="px-3 py-2 font-medium">{locale === "ru" ? "Слаг" : "Slug"}</th>
                      <th className="px-3 py-2 font-medium">{locale === "ru" ? "Язык" : "Locale"}</th>
                      <th className="px-3 py-2 text-right font-medium">
                        {locale === "ru" ? "Статей" : "Posts"}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {locale === "ru" ? "Действия" : "Actions"}
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
                                {locale === "ru" ? "Сохр." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void remove(tag)}
                                disabled={busy === tag.id}
                                className="rounded-md px-2 py-1 text-[11px] text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                              >
                                {locale === "ru" ? "Удал." : "Delete"}
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
              {locale === "ru" ? "Новый тег" : "New tag"}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px_auto]">
              <input
                type="text"
                value={newTag.displayName}
                onChange={(e) => setNewTag((s) => ({ ...s, displayName: e.target.value }))}
                placeholder={locale === "ru" ? "Название (например, Советы хостам)" : "Display name (e.g. Hosting tips)"}
                maxLength={NAME_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
              <input
                type="text"
                value={newTag.slug}
                onChange={(e) => setNewTag((s) => ({ ...s, slug: e.target.value }))}
                placeholder={locale === "ru" ? "слаг (необязательно)" : "slug (optional)"}
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
                {creating
                  ? locale === "ru"
                    ? "Добавляется…"
                    : "Adding…"
                  : locale === "ru"
                  ? "Добавить"
                  : "Add"}
              </button>
            </div>
            {createError && <p className="mt-2 text-xs text-rose-300">{createError}</p>}
          </div>

          {/* Merge tags */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-1 text-sm font-medium text-[var(--ink)]">
              {locale === "ru" ? "Объединить теги" : "Merge tags"}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {locale === "ru"
                ? "Перенести все статьи с тега-источника на тег-назначение, потом удалить источник. Оба тега должны быть на одном языке."
                : "Move every post from a source tag onto a destination tag, then delete the source. Both tags must share a locale."}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              >
                <option value="">{locale === "ru" ? "Источник…" : "Source tag…"}</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName} · {t.locale} · {t.postCount}
                  </option>
                ))}
              </select>
              <select
                value={mergeDestId}
                onChange={(e) => setMergeDestId(e.target.value)}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              >
                <option value="">{locale === "ru" ? "Назначение…" : "Destination tag…"}</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName} · {t.locale} · {t.postCount}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void merge()}
                disabled={merging || !mergeSourceId || !mergeDestId}
                className="h-9 rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {merging
                  ? locale === "ru"
                    ? "Объединение…"
                    : "Merging…"
                  : locale === "ru"
                  ? "Объединить"
                  : "Merge"}
              </button>
            </div>
            {mergeError && <p className="mt-2 text-xs text-rose-300">{mergeError}</p>}
          </div>
        </>
      )}
    </div>
  );
}
