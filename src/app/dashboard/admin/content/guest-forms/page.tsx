"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 26 — Guest form templates sub-route at
// /dashboard/admin/content/guest-forms. Cross-property overview of
// every GuestFormTemplate the user can manage (RT-25.2). Same pattern
// as iCal links / feed tokens / message templates — read-only summary
// in the admin shell, edits stay on the per-property settings tab via
// a deep-link. Surfaces field-count + submission-count per template so
// hosts can spot which properties have an active template and how
// often guests are filling it.

interface CopyShape {
  title: string;
  description: string;
  loadFailed: string;
  loading: string;
  empty: string;
  loadingEllipsis: string;
  summary: (totalCount: number, propertyCount: number, totalSubmissions: number) => string;
  openSync: string;
  untitled: string;
  fields: (n: number) => string;
  submissions: (n: number) => string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Guest form templates",
    description:
      "All guest pre-arrival form templates across your properties. Click a property to open its Sync settings, where the template is edited.",
    loadFailed: "Failed to load",
    loading: "Loading...",
    empty:
      "No guest forms configured yet. Open a property and build a template on its Sync settings tab.",
    loadingEllipsis: "Loading...",
    summary: (totalCount, propertyCount, totalSubmissions) =>
      `${totalCount} template${totalCount === 1 ? "" : "s"} across ${propertyCount} propert${
        propertyCount === 1 ? "y" : "ies"
      } · ${totalSubmissions} submission${totalSubmissions === 1 ? "" : "s"}.`,
    openSync: "Open Sync",
    untitled: "Untitled template",
    fields: (n) => `${n} field${n === 1 ? "" : "s"}`,
    submissions: (n) => `${n} submission${n === 1 ? "" : "s"}`,
  },
  ru: {
    title: "Шаблоны анкет гостей",
    description:
      "Все шаблоны анкет гостей по объектам. Нажмите на объект, чтобы открыть настройки синхронизации, где шаблон редактируется.",
    loadFailed: "Не удалось загрузить",
    loading: "Загрузка...",
    empty:
      "Шаблоны анкет ещё не настроены. Откройте объект и создайте шаблон во вкладке настроек синхронизации.",
    loadingEllipsis: "Загрузка...",
    summary: (totalCount, propertyCount, totalSubmissions) =>
      `${totalCount} шаблон(ов) в ${propertyCount} объект(ах) · ${totalSubmissions} ответ(ов).`,
    openSync: "Открыть синхронизацию",
    untitled: "Без названия",
    fields: (n) => `${n} пол(ей)`,
    submissions: (n) => `${n} ответ(ов)`,
  },
  de: {
    title: "Gästeformular-Vorlagen",
    description:
      "Alle Vorlagen für Gäste-Anreiseformulare über Ihre Objekte. Klicken Sie auf ein Objekt, um die Sync-Einstellungen zu öffnen, in denen die Vorlage bearbeitet wird.",
    loadFailed: "Laden fehlgeschlagen",
    loading: "Wird geladen...",
    empty:
      "Noch keine Gästeformulare konfiguriert. Öffnen Sie ein Objekt und erstellen Sie eine Vorlage im Sync-Einstellungs-Tab.",
    loadingEllipsis: "Wird geladen...",
    summary: (totalCount, propertyCount, totalSubmissions) =>
      `${totalCount} Vorlage${totalCount === 1 ? "" : "n"} über ${propertyCount} Objekt${
        propertyCount === 1 ? "" : "e"
      } · ${totalSubmissions} Einreichung${totalSubmissions === 1 ? "" : "en"}.`,
    openSync: "Sync öffnen",
    untitled: "Vorlage ohne Titel",
    fields: (n) => `${n} Feld${n === 1 ? "" : "er"}`,
    submissions: (n) => `${n} Einreichung${n === 1 ? "" : "en"}`,
  },
  fr: {
    title: "Modèles de formulaires voyageurs",
    description:
      "Tous les modèles de formulaires pré-arrivée pour les voyageurs sur vos logements. Cliquez sur un logement pour ouvrir ses paramètres Sync, où le modèle se modifie.",
    loadFailed: "Échec du chargement",
    loading: "Chargement...",
    empty:
      "Aucun formulaire voyageur configuré pour l'instant. Ouvrez un logement et créez un modèle dans l'onglet Sync.",
    loadingEllipsis: "Chargement...",
    summary: (totalCount, propertyCount, totalSubmissions) =>
      `${totalCount} modèle${totalCount === 1 ? "" : "s"} sur ${propertyCount} logement${
        propertyCount === 1 ? "" : "s"
      } · ${totalSubmissions} réponse${totalSubmissions === 1 ? "" : "s"}.`,
    openSync: "Ouvrir Sync",
    untitled: "Modèle sans titre",
    fields: (n) => `${n} champ${n === 1 ? "" : "s"}`,
    submissions: (n) => `${n} réponse${n === 1 ? "" : "s"}`,
  },
  es: {
    title: "Plantillas de formularios para huéspedes",
    description:
      "Todas las plantillas de formularios previos a la llegada en sus alojamientos. Pulse en un alojamiento para abrir sus ajustes de Sync, donde se edita la plantilla.",
    loadFailed: "Error al cargar",
    loading: "Cargando...",
    empty:
      "Aún no hay formularios para huéspedes configurados. Abra un alojamiento y cree una plantilla en la pestaña de ajustes de Sync.",
    loadingEllipsis: "Cargando...",
    summary: (totalCount, propertyCount, totalSubmissions) =>
      `${totalCount} plantilla${totalCount === 1 ? "" : "s"} en ${propertyCount} alojamiento${
        propertyCount === 1 ? "" : "s"
      } · ${totalSubmissions} respuesta${totalSubmissions === 1 ? "" : "s"}.`,
    openSync: "Abrir Sync",
    untitled: "Plantilla sin título",
    fields: (n) => `${n} campo${n === 1 ? "" : "s"}`,
    submissions: (n) => `${n} respuesta${n === 1 ? "" : "s"}`,
  },
};

interface TemplateRow {
  id: number;
  propertyId: number;
  name: string;
  fieldCount: number;
  submissionCount: number;
  createdAt: string;
  updatedAt: string | null;
  property: { id: number; name: string };
}

interface ApiResponse {
  templates?: TemplateRow[];
}

export default function AdminGuestFormsPage() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guest-form-templates")
      .then((r) => (r.ok ? (r.json() as Promise<ApiResponse>) : null))
      .then((data) => {
        const list = Array.isArray(data?.templates) ? data!.templates! : [];
        setRows(list);
      })
      .catch(() => setError(c.loadFailed))
      .finally(() => setLoaded(true));
  }, [c.loadFailed]);

  const grouped = useMemo(() => {
    const m = new Map<
      number,
      { property: { id: number; name: string }; templates: TemplateRow[] }
    >();
    for (const r of rows) {
      const entry = m.get(r.propertyId) ?? { property: r.property, templates: [] };
      entry.templates.push(r);
      m.set(r.propertyId, entry);
    }
    return Array.from(m.values()).sort((a, b) =>
      a.property.name.localeCompare(b.property.name),
    );
  }, [rows]);

  const totalCount = rows.length;
  const propertyCount = grouped.length;
  const totalSubmissions = rows.reduce((sum, r) => sum + r.submissionCount, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {c.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {c.description}
        </p>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {c.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-300">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {c.empty}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-3 text-sm text-[var(--ink-3)]">
            {c.summary(totalCount, propertyCount, totalSubmissions)}
          </div>
          <div className="space-y-4">
            {grouped.map((g) => (
              <div
                key={g.property.id}
                className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]"
              >
                <Link
                  href={`/dashboard?property=${g.property.id}&view=sync`}
                  className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-3)]/40 px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)]"
                >
                  <span>{g.property.name}</span>
                  <span className="flex items-center gap-1 text-xs text-[var(--ink-4)]">
                    {c.openSync}
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </span>
                </Link>
                <ul className="divide-y divide-[var(--line)]/50">
                  {g.templates.map((tpl) => (
                    <li
                      key={tpl.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--ink)]">
                          {tpl.name || c.untitled}
                        </div>
                        <div className="text-[11px] text-[var(--ink-4)]">
                          {c.fields(tpl.fieldCount)}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          tpl.submissionCount > 0
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-[var(--bg-3)] text-[var(--ink-3)]"
                        }`}
                      >
                        {c.submissions(tpl.submissionCount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
