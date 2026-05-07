"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loading: string;
  notSuperadmin: string;
  imagesLabel: string;
  refreshing: string;
  refresh: string;
  loadFailed: (status: number) => string;
  loadFailedShort: string;
  emptyMedia: string;
  imagesHeader: string;
  usedBy: (n: number) => string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Blog media",
    description:
      "Every external OG image URL referenced by a blog post. Direct uploads ship once R2 / S3 storage is wired (RT-21.x); for now this surfaces what's already attached to post.ogImageUrl.",
    loading: "Loading...",
    notSuperadmin: "Only superadmins can view blog media.",
    imagesLabel: "Images",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    loadFailed: (status) => `Failed to load blog posts (${status})`,
    loadFailedShort: "Failed to load blog posts",
    emptyMedia: "No posts reference an OG image yet. Set one from the post editor.",
    imagesHeader: "Images",
    usedBy: (n) => `Used by ${n} post${n === 1 ? "" : "s"}`,
  },
  ru: {
    title: "Медиа блога",
    description:
      "Все внешние OG-картинки, на которые ссылаются статьи блога. Прямая загрузка появится после подключения R2 / S3 (RT-21.x); пока страница только показывает то, что уже привязано к post.ogImageUrl.",
    loading: "Загрузка...",
    notSuperadmin: "Только суперадминистратор может видеть медиа блога.",
    imagesLabel: "Картинки",
    refreshing: "Обновляется...",
    refresh: "Обновить",
    loadFailed: (status) => `Не удалось загрузить статьи (${status})`,
    loadFailedShort: "Не удалось загрузить статьи",
    emptyMedia: "Ни одна статья ещё не ссылается на OG-картинку. Назначьте её в редакторе статьи.",
    imagesHeader: "Картинки",
    usedBy: (n) => `Используется в ${n} ${n === 1 ? "статье" : "статьях"}`,
  },
  de: {
    title: "Blog-Medien",
    description:
      "Alle externen OG-Bild-URLs, die von Blogbeiträgen referenziert werden. Direkter Upload folgt, sobald R2- / S3-Speicher angebunden ist (RT-21.x); aktuell zeigt diese Seite nur, was bereits an post.ogImageUrl angehängt ist.",
    loading: "Wird geladen...",
    notSuperadmin: "Nur Superadmins können Blog-Medien einsehen.",
    imagesLabel: "Bilder",
    refreshing: "Wird aktualisiert...",
    refresh: "Aktualisieren",
    loadFailed: (status) => `Blogbeiträge konnten nicht geladen werden (${status})`,
    loadFailedShort: "Blogbeiträge konnten nicht geladen werden",
    emptyMedia: "Noch kein Beitrag verweist auf ein OG-Bild. Setzen Sie eines im Beitragseditor.",
    imagesHeader: "Bilder",
    usedBy: (n) => `Verwendet in ${n} Beitrag${n === 1 ? "" : "en"}`,
  },
  fr: {
    title: "Médias du blog",
    description:
      "Toutes les URL d'images OG externes référencées par les articles du blog. L'upload direct arrivera une fois R2 / S3 branché (RT-21.x) ; pour l'instant cette page n'expose que ce qui est déjà rattaché à post.ogImageUrl.",
    loading: "Chargement...",
    notSuperadmin: "Seuls les superadmins peuvent voir les médias du blog.",
    imagesLabel: "Images",
    refreshing: "Actualisation...",
    refresh: "Actualiser",
    loadFailed: (status) => `Échec du chargement des articles (${status})`,
    loadFailedShort: "Échec du chargement des articles",
    emptyMedia: "Aucun article ne référence d'image OG pour l'instant. Définissez-en une depuis l'éditeur d'article.",
    imagesHeader: "Images",
    usedBy: (n) => `Utilisée dans ${n} article${n === 1 ? "" : "s"}`,
  },
  es: {
    title: "Medios del blog",
    description:
      "Todas las URL externas de imágenes OG referenciadas por los artículos del blog. La subida directa llegará cuando se conecte el almacenamiento R2 / S3 (RT-21.x); por ahora esta página solo muestra lo que ya está enlazado en post.ogImageUrl.",
    loading: "Cargando...",
    notSuperadmin: "Solo los superadministradores pueden ver los medios del blog.",
    imagesLabel: "Imágenes",
    refreshing: "Actualizando...",
    refresh: "Actualizar",
    loadFailed: (status) => `No se pudieron cargar los artículos (${status})`,
    loadFailedShort: "No se pudieron cargar los artículos",
    emptyMedia: "Ningún artículo referencia una imagen OG todavía. Defínala desde el editor del artículo.",
    imagesHeader: "Imágenes",
    usedBy: (n) => `Usada en ${n} artículo${n === 1 ? "" : "s"}`,
  },
};

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
  const c = COPY[locale];
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
        setError(c.loadFailed(res.status));
        return;
      }
      const data = (await res.json()) as BlogPostRow[];
      setPosts(data);
    } catch {
      setError(c.loadFailedShort);
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
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2">
          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
              {c.imagesHeader}
              {mediaUsage.length > 0 && ` · ${mediaUsage.length}`}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-md px-2.5 py-1 text-xs text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              {loading ? c.refreshing : c.refresh}
            </button>
          </div>

          {error && <p className="px-3 py-2 text-xs text-rose-300">{error}</p>}
          {!error && mediaUsage.length === 0 && !loading && (
            <p className="px-3 py-2 text-xs text-[var(--ink-4)]">
              {c.emptyMedia}
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
                      {c.usedBy(m.posts.length)}
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
