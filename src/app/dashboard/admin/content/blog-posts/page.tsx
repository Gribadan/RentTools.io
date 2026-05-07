"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loading: string;
  notSuperadmin: string;
  statusFilterLabel: string;
  localeFilterLabel: string;
  filterAll: string;
  filterDraft: string;
  filterPublished: string;
  filterArchived: string;
  refreshing: string;
  refresh: string;
  loadFailed: (status: number) => string;
  loadFailedShort: string;
  failedUpdate: string;
  updated: string;
  failedDelete: string;
  failedCreate: string;
  confirmDeleteWithComments: (title: string, count: number) => string;
  confirmDelete: (title: string) => string;
  selectedCount: (n: number) => string;
  publish: string;
  moveToDraft: string;
  archive: string;
  clear: string;
  bulkConfirm: (action: "publish" | "draft" | "archive", count: number) => string;
  bulkFailed: string;
  bulkResult: (updated: number, skipped: number) => string;
  selectAllAria: string;
  colTitle: string;
  colLocale: string;
  colStatus: string;
  colAuthor: string;
  colCreated: string;
  colPublished: string;
  colComments: string;
  colActions: string;
  emptyAll: string;
  emptyFiltered: string;
  rowDraft: string;
  rowPublished: string;
  rowArchived: string;
  edit: string;
  delete: string;
  shiftClickHint: string;
  newPostTitle: string;
  newPostDescription: string;
  newPostTitlePlaceholder: string;
  newPostSlugPlaceholder: string;
  newPostExcerptPlaceholder: string;
  creating: string;
  createDraft: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Blog posts",
    description:
      "Manage posts: status, metadata, delete, bulk publish. Body, tags, and translation pairing are edited from each post's dedicated editor page.",
    loading: "Loading...",
    notSuperadmin: "Only superadmins can manage blog posts.",
    statusFilterLabel: "Status",
    localeFilterLabel: "Locale",
    filterAll: "All",
    filterDraft: "Draft",
    filterPublished: "Published",
    filterArchived: "Archived",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    loadFailed: (status) => `Failed to load blog posts (${status})`,
    loadFailedShort: "Failed to load blog posts",
    failedUpdate: "Failed to update",
    updated: "Updated.",
    failedDelete: "Failed to delete",
    failedCreate: "Failed to create",
    confirmDeleteWithComments: (title, count) =>
      `Delete "${title}"? This will also remove ${count} comment(s). This cannot be undone.`,
    confirmDelete: (title) => `Delete "${title}"? This cannot be undone.`,
    selectedCount: (n) => `${n} selected`,
    publish: "Publish",
    moveToDraft: "Move to draft",
    archive: "Archive",
    clear: "Clear",
    bulkConfirm: (action, count) => {
      const verb = action === "publish" ? "Publish" : action === "archive" ? "Archive" : "Move to draft";
      return `${verb} ${count} post(s)?`;
    },
    bulkFailed: "Bulk update failed",
    bulkResult: (updated, skipped) =>
      `Updated ${updated} post(s)${skipped > 0 ? `, skipped ${skipped}` : ""}.`,
    selectAllAria: "Select all visible posts",
    colTitle: "Title",
    colLocale: "Locale",
    colStatus: "Status",
    colAuthor: "Author",
    colCreated: "Created",
    colPublished: "Published",
    colComments: "Comments",
    colActions: "Actions",
    emptyAll: "No blog posts yet. Use the form below to create your first draft.",
    emptyFiltered: "No posts match the current filters.",
    rowDraft: "Draft",
    rowPublished: "Published",
    rowArchived: "Archived",
    edit: "Edit",
    delete: "Delete",
    shiftClickHint: "Tip: shift-click a checkbox to select a range.",
    newPostTitle: "New post",
    newPostDescription:
      "Creates a draft. Open the post afterwards to write the body, set tags, pick an OG image, and link a translation pair.",
    newPostTitlePlaceholder: "Title",
    newPostSlugPlaceholder: "Slug (optional — derived from title if blank)",
    newPostExcerptPlaceholder: "Excerpt (140-160 chars, used as meta description)",
    creating: "Creating…",
    createDraft: "Create draft",
  },
  ru: {
    title: "Статьи блога",
    description:
      "Управление статьями: статус, метаданные, удаление, массовая публикация. Содержимое и теги редактируются на странице редактора каждой статьи.",
    loading: "Загрузка...",
    notSuperadmin: "Только суперадминистратор может управлять статьями блога.",
    statusFilterLabel: "Статус",
    localeFilterLabel: "Язык",
    filterAll: "Все",
    filterDraft: "Черновик",
    filterPublished: "Опубликовано",
    filterArchived: "Архив",
    refreshing: "Обновляется...",
    refresh: "Обновить",
    loadFailed: (status) => `Не удалось загрузить статьи (${status})`,
    loadFailedShort: "Не удалось загрузить статьи",
    failedUpdate: "Не удалось обновить",
    updated: "Обновлено.",
    failedDelete: "Не удалось удалить",
    failedCreate: "Не удалось создать",
    confirmDeleteWithComments: (title, count) =>
      `Удалить «${title}»? Будет также удалено ${count} комментариев. Действие необратимо.`,
    confirmDelete: (title) => `Удалить «${title}»? Действие необратимо.`,
    selectedCount: (n) => `Выбрано ${n}`,
    publish: "Опубликовать",
    moveToDraft: "В черновик",
    archive: "Архив",
    clear: "Очистить",
    bulkConfirm: (action, count) => {
      const verb = action === "publish" ? "Опубликовать" : action === "archive" ? "Архивировать" : "В черновик";
      return `${verb} ${count} статей?`;
    },
    bulkFailed: "Массовое обновление не удалось",
    bulkResult: (updated, skipped) =>
      `Обновлено ${updated}${skipped > 0 ? `, пропущено ${skipped}` : ""}.`,
    selectAllAria: "Выбрать всё видимое",
    colTitle: "Заголовок",
    colLocale: "Язык",
    colStatus: "Статус",
    colAuthor: "Автор",
    colCreated: "Создано",
    colPublished: "Опубл.",
    colComments: "Комм.",
    colActions: "Действия",
    emptyAll: "Статей ещё нет. Создайте черновик ниже.",
    emptyFiltered: "Нет статей под текущие фильтры.",
    rowDraft: "Черновик",
    rowPublished: "Опубл.",
    rowArchived: "Архив",
    edit: "Редакт.",
    delete: "Удал.",
    shiftClickHint: "Подсказка: shift-клик по чекбоксу выделяет диапазон.",
    newPostTitle: "Новая статья",
    newPostDescription:
      "Создаётся черновик. Откройте статью, чтобы написать тело, выбрать теги, OG-картинку и связать перевод.",
    newPostTitlePlaceholder: "Заголовок",
    newPostSlugPlaceholder: "Слаг (необязательно — генерируется из заголовка)",
    newPostExcerptPlaceholder: "Анонс (140-160 символов, используется как meta description)",
    creating: "Создаётся…",
    createDraft: "Создать черновик",
  },
  de: {
    title: "Blogbeiträge",
    description:
      "Beiträge verwalten: Status, Metadaten, Löschen, Massenveröffentlichung. Inhalt, Tags und Übersetzungspaare werden auf der Editor-Seite jedes Beitrags bearbeitet.",
    loading: "Wird geladen...",
    notSuperadmin: "Nur Superadmins können Blogbeiträge verwalten.",
    statusFilterLabel: "Status",
    localeFilterLabel: "Sprache",
    filterAll: "Alle",
    filterDraft: "Entwurf",
    filterPublished: "Veröffentlicht",
    filterArchived: "Archiviert",
    refreshing: "Wird aktualisiert...",
    refresh: "Aktualisieren",
    loadFailed: (status) => `Blogbeiträge konnten nicht geladen werden (${status})`,
    loadFailedShort: "Blogbeiträge konnten nicht geladen werden",
    failedUpdate: "Aktualisierung fehlgeschlagen",
    updated: "Aktualisiert.",
    failedDelete: "Löschen fehlgeschlagen",
    failedCreate: "Erstellen fehlgeschlagen",
    confirmDeleteWithComments: (title, count) =>
      `„${title}" löschen? Dabei werden auch ${count} Kommentar(e) entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`,
    confirmDelete: (title) => `„${title}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    selectedCount: (n) => `${n} ausgewählt`,
    publish: "Veröffentlichen",
    moveToDraft: "Als Entwurf",
    archive: "Archivieren",
    clear: "Auswahl aufheben",
    bulkConfirm: (action, count) => {
      const verb = action === "publish" ? "Veröffentlichen" : action === "archive" ? "Archivieren" : "Als Entwurf setzen";
      return `${count} Beitrag/Beiträge ${verb.toLowerCase()}?`;
    },
    bulkFailed: "Massenaktualisierung fehlgeschlagen",
    bulkResult: (updated, skipped) =>
      `${updated} Beitrag/Beiträge aktualisiert${skipped > 0 ? `, ${skipped} übersprungen` : ""}.`,
    selectAllAria: "Alle sichtbaren Beiträge auswählen",
    colTitle: "Titel",
    colLocale: "Sprache",
    colStatus: "Status",
    colAuthor: "Autor",
    colCreated: "Erstellt",
    colPublished: "Veröff.",
    colComments: "Komm.",
    colActions: "Aktionen",
    emptyAll: "Noch keine Blogbeiträge. Erstellen Sie unten Ihren ersten Entwurf.",
    emptyFiltered: "Keine Beiträge passen zu den aktuellen Filtern.",
    rowDraft: "Entwurf",
    rowPublished: "Veröff.",
    rowArchived: "Archiv",
    edit: "Bearbeiten",
    delete: "Löschen",
    shiftClickHint: "Tipp: Shift-Klick auf eine Checkbox wählt einen Bereich aus.",
    newPostTitle: "Neuer Beitrag",
    newPostDescription:
      "Erstellt einen Entwurf. Öffnen Sie den Beitrag anschließend, um den Inhalt zu schreiben, Tags zu setzen, ein OG-Bild zu wählen und ein Übersetzungspaar zu verknüpfen.",
    newPostTitlePlaceholder: "Titel",
    newPostSlugPlaceholder: "Slug (optional — wird aus dem Titel abgeleitet, wenn leer)",
    newPostExcerptPlaceholder: "Auszug (140-160 Zeichen, wird als Meta-Description verwendet)",
    creating: "Wird erstellt…",
    createDraft: "Entwurf erstellen",
  },
  fr: {
    title: "Articles de blog",
    description:
      "Gérez les articles : statut, métadonnées, suppression, publication en masse. Le contenu, les tags et l'appariement de traduction se modifient depuis la page éditeur de chaque article.",
    loading: "Chargement...",
    notSuperadmin: "Seuls les superadmins peuvent gérer les articles de blog.",
    statusFilterLabel: "Statut",
    localeFilterLabel: "Langue",
    filterAll: "Tous",
    filterDraft: "Brouillon",
    filterPublished: "Publié",
    filterArchived: "Archivé",
    refreshing: "Actualisation...",
    refresh: "Actualiser",
    loadFailed: (status) => `Échec du chargement des articles (${status})`,
    loadFailedShort: "Échec du chargement des articles",
    failedUpdate: "Échec de la mise à jour",
    updated: "Mis à jour.",
    failedDelete: "Échec de la suppression",
    failedCreate: "Échec de la création",
    confirmDeleteWithComments: (title, count) =>
      `Supprimer « ${title} » ? Cela supprimera aussi ${count} commentaire(s). Action irréversible.`,
    confirmDelete: (title) => `Supprimer « ${title} » ? Action irréversible.`,
    selectedCount: (n) => `${n} sélectionné(s)`,
    publish: "Publier",
    moveToDraft: "Mettre en brouillon",
    archive: "Archiver",
    clear: "Effacer",
    bulkConfirm: (action, count) => {
      const verb = action === "publish" ? "Publier" : action === "archive" ? "Archiver" : "Mettre en brouillon";
      return `${verb} ${count} article(s) ?`;
    },
    bulkFailed: "Échec de la mise à jour groupée",
    bulkResult: (updated, skipped) =>
      `${updated} article(s) mis à jour${skipped > 0 ? `, ${skipped} ignoré(s)` : ""}.`,
    selectAllAria: "Sélectionner tous les articles visibles",
    colTitle: "Titre",
    colLocale: "Langue",
    colStatus: "Statut",
    colAuthor: "Auteur",
    colCreated: "Créé",
    colPublished: "Publié",
    colComments: "Comm.",
    colActions: "Actions",
    emptyAll: "Aucun article pour l'instant. Utilisez le formulaire ci-dessous pour créer un brouillon.",
    emptyFiltered: "Aucun article ne correspond aux filtres actuels.",
    rowDraft: "Brouillon",
    rowPublished: "Publié",
    rowArchived: "Archivé",
    edit: "Modifier",
    delete: "Suppr.",
    shiftClickHint: "Astuce : shift-clic sur une case à cocher pour sélectionner une plage.",
    newPostTitle: "Nouvel article",
    newPostDescription:
      "Crée un brouillon. Ouvrez ensuite l'article pour rédiger le contenu, choisir les tags, sélectionner une image OG et lier une paire de traduction.",
    newPostTitlePlaceholder: "Titre",
    newPostSlugPlaceholder: "Slug (optionnel — dérivé du titre si vide)",
    newPostExcerptPlaceholder: "Extrait (140-160 caractères, utilisé comme meta description)",
    creating: "Création…",
    createDraft: "Créer un brouillon",
  },
};

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
  const t = COPY[locale];
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
        setError(t.loadFailed(res.status));
        return;
      }
      const data = (await res.json()) as BlogPostRow[];
      setPosts(data);
    } catch {
      setError(t.loadFailedShort);
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
          text: data.error ?? t.failedUpdate,
          ok: false,
        });
        return;
      }
      setMessage({
        id: post.id,
        text: t.updated,
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
        ? t.confirmDeleteWithComments(post.title, post.commentCount)
        : t.confirmDelete(post.title);
    if (!confirm(warn)) return;
    setBusy(post.id);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage({
          id: post.id,
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
      const res = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(data.error ?? t.failedCreate);
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
    const action = status === "published" ? "publish" : status === "archived" ? "archive" : "draft";
    if (!confirm(t.bulkConfirm(action, ids.length))) return;
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
          text: data.error ?? t.bulkFailed,
          ok: false,
        });
        return;
      }
      const data = (await res.json()) as { updated: number; skipped: number[] };
      setBulkMessage({
        text: t.bulkResult(data.updated, data.skipped.length),
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
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[var(--ink-4)]" htmlFor="post-status">
              {t.statusFilterLabel}
            </label>
            <select
              id="post-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            >
              <option value="all">{t.filterAll}</option>
              <option value="draft">{t.filterDraft}</option>
              <option value="published">{t.filterPublished}</option>
              <option value="archived">{t.filterArchived}</option>
            </select>
            <label className="ml-3 text-xs text-[var(--ink-4)]" htmlFor="post-locale">
              {t.localeFilterLabel}
            </label>
            <select
              id="post-locale"
              value={localeFilter}
              onChange={(e) => setLocaleFilter(e.target.value as LocaleFilter)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
            >
              <option value="all">{t.filterAll}</option>
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
              {loading ? t.refreshing : t.refresh}
            </button>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ink)]/30 bg-[var(--bg-3)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--ink)]">
                {t.selectedCount(selected.size)}
              </span>
              <button
                type="button"
                onClick={() => void bulkSetStatus("published")}
                disabled={bulkBusy}
                className="rounded-md bg-[var(--ink)] px-3 py-1 text-xs font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {t.publish}
              </button>
              <button
                type="button"
                onClick={() => void bulkSetStatus("draft")}
                disabled={bulkBusy}
                className="rounded-md px-3 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {t.moveToDraft}
              </button>
              <button
                type="button"
                onClick={() => void bulkSetStatus("archived")}
                disabled={bulkBusy}
                className="rounded-md px-3 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
              >
                {t.archive}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkBusy}
                className="rounded-md px-3 py-1 text-xs text-[var(--ink-4)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {t.clear}
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
                {posts.length === 0 ? t.emptyAll : t.emptyFiltered}
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
                          aria-label={t.selectAllAria}
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
                          {t.colTitle}
                          {sortIndicator("title")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("locale")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {t.colLocale}
                          {sortIndicator("locale")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("status")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {t.colStatus}
                          {sortIndicator("status")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">{t.colAuthor}</th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("createdAt")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {t.colCreated}
                          {sortIndicator("createdAt")}
                        </button>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("publishedAt")}
                          className="text-left transition-colors hover:text-[var(--ink-2)]"
                        >
                          {t.colPublished}
                          {sortIndicator("publishedAt")}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort("commentCount")}
                          className="transition-colors hover:text-[var(--ink-2)]"
                        >
                          {t.colComments}
                          {sortIndicator("commentCount")}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.colActions}
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
                            <option value="draft">{t.rowDraft}</option>
                            <option value="published">{t.rowPublished}</option>
                            <option value="archived">{t.rowArchived}</option>
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
                              {t.edit}
                            </a>
                            <button
                              type="button"
                              onClick={() => void remove(post)}
                              disabled={busy === post.id}
                              className="rounded-md px-2 py-1 text-[11px] text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                            >
                              {t.delete}
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
              {t.shiftClickHint}
            </p>
          </div>

          {/* New post */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
            <p className="mb-3 text-sm font-medium text-[var(--ink)]">
              {t.newPostTitle}
            </p>
            <p className="mb-4 text-xs text-[var(--ink-4)]">
              {t.newPostDescription}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost((s) => ({ ...s, title: e.target.value }))}
                placeholder={t.newPostTitlePlaceholder}
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
                placeholder={t.newPostSlugPlaceholder}
                maxLength={SLUG_MAX}
                className="h-9 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 font-mono text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]"
              />
              <textarea
                value={newPost.excerpt}
                onChange={(e) => setNewPost((s) => ({ ...s, excerpt: e.target.value }))}
                placeholder={t.newPostExcerptPlaceholder}
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
                {creating ? t.creating : t.createDraft}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
