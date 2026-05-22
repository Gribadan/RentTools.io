"use client";

import { useCallback, useEffect, useState } from "react";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { PropertySwitcher } from "@/components/property-switcher";
import { useIncludePotential } from "@/lib/use-include-potential";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

interface CopyShape {
  emptyState: string;
  cleaning: string;
  acrossAllProperties: (count: number) => string;
  allPropertiesLabel: (count: number) => string;
  view: string;
  potentialHelper: string;
  dataSources: string;
  dataSourcesHelper: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    emptyState: "Add a property to see the cleaning schedule.",
    cleaning: "Cleaning",
    acrossAllProperties: (count) =>
      `Across all ${count} ${count === 1 ? "property" : "properties"}`,
    allPropertiesLabel: (count) => `All properties (${count})`,
    view: "View",
    potentialHelper: "Cleanings that only matter if a gap-fill guest books.",
    dataSources: "Data sources",
    dataSourcesHelper:
      "Schedule is computed from your reservations + iCal events, deduped. Property names appear in each row when copying / printing.",
  },
  ru: {
    emptyState: "Добавьте объект, чтобы увидеть расписание уборок.",
    cleaning: "Уборки",
    acrossAllProperties: (count) => `По всем объектам (${count})`,
    allPropertiesLabel: (count) => `Все объекты (${count})`,
    view: "Отображение",
    potentialHelper:
      "Уборки, которые понадобятся только если промежуток будет занят гостем.",
    dataSources: "Источники данных",
    dataSourcesHelper:
      "Расписание считается из ваших броней + iCal событий, дедуплицированных. Названия объектов попадают в каждую строку при копировании / печати.",
  },
  de: {
    emptyState: "Fügen Sie eine Unterkunft hinzu, um den Reinigungsplan zu sehen.",
    cleaning: "Reinigung",
    acrossAllProperties: (count) =>
      `Über alle ${count} ${count === 1 ? "Unterkunft" : "Unterkünfte"}`,
    allPropertiesLabel: (count) => `Alle Unterkünfte (${count})`,
    view: "Ansicht",
    potentialHelper:
      "Reinigungen, die nur relevant werden, wenn ein Lückenfüller-Gast bucht.",
    dataSources: "Datenquellen",
    dataSourcesHelper:
      "Der Plan wird aus Ihren Buchungen + iCal-Events berechnet (dedupliziert). Beim Kopieren / Drucken erscheint der Name der Unterkunft in jeder Zeile.",
  },
  fr: {
    emptyState: "Ajoutez un logement pour voir le planning des ménages.",
    cleaning: "Ménage",
    acrossAllProperties: (count) => `Sur l’ensemble des ${count} logements`,
    allPropertiesLabel: (count) => `Tous les logements (${count})`,
    view: "Affichage",
    potentialHelper:
      "Ménages utiles uniquement si un voyageur réserve sur la période libre.",
    dataSources: "Sources de données",
    dataSourcesHelper:
      "Le planning est calculé à partir de vos réservations + événements iCal, dédupliqués. Le nom du logement apparaît sur chaque ligne lors de la copie / impression.",
  },
  es: {
    emptyState: "Añada un alojamiento para ver el calendario de limpiezas.",
    cleaning: "Limpieza",
    acrossAllProperties: (count) =>
      `En todos los ${count} ${count === 1 ? "alojamiento" : "alojamientos"}`,
    allPropertiesLabel: (count) => `Todos los alojamientos (${count})`,
    view: "Vista",
    potentialHelper:
      "Limpiezas que solo importan si un huésped reserva el hueco intermedio.",
    dataSources: "Fuentes de datos",
    dataSourcesHelper:
      "El calendario se calcula a partir de sus reservas + eventos iCal, deduplicados. El nombre del alojamiento aparece en cada línea al copiar / imprimir.",
  },
};

// Sidebar carries the View toggle (include-potential) + a Data
// sources note. Copy + Print live inline in the schedule's table
// header so the host can grab the export with one tap; the toggle
// lives here so view-state stays grouped with future settings.

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface GlobalCleaningViewProps {
  properties: Property[];
}

/**
 * Cross-property cleaning view rendered when activeView === "cleaning"
 * AND no property is selected. Schedule is fullwidth — controls
 * (Include-potential / Copy / Print) live inline in the schedule's
 * table header so the host can grab the export with one tap. The
 * per-property master toggle + Cleaners panel are intentionally not
 * here — those belong to PropertyCleaningView.
 */
export function GlobalCleaningView({ properties }: GlobalCleaningViewProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];
  const [syncedEvents, setSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [links, setLinks] = useState<Record<number, CalendarLink[]>>({});
  const [overrides, setOverrides] = useState<Record<number, DateOverride[]>>({});
  const [assignmentsByProperty, setAssignmentsByProperty] = useState<Record<number, CleanerAssignmentInfo[]>>({});
  const [includePotential, setIncludePotential] = useIncludePotential();
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (properties.length === 0) {
      setSyncedEvents({});
      setLinks({});
      setOverrides({});
      setAssignmentsByProperty({});
      return;
    }
    type AssignmentRow = {
      cleanerProfileId: number | null;
      cleanerId: number | null;
      cleanerName: string | null;
      username: string | null;
      priority: number;
    };
    const results = await Promise.all(
      properties.map(async (p) => {
        const [syncRes, linksRes, ovRes, asgRes] = await Promise.all([
          fetch(`/api/calendar/sync?propertyId=${p.id}&limit=200`).then((r) => r.json()),
          fetch(`/api/calendar/links?propertyId=${p.id}`).then((r) => r.json()),
          fetch(`/api/date-overrides?propertyId=${p.id}`).then((r) => r.json()),
          fetch(`/api/cleaner-assignments?propertyId=${p.id}`).then((r) => (r.ok ? r.json() : [])),
        ]);
        const list: AssignmentRow[] = Array.isArray(asgRes) ? asgRes : [];
        const assignments = list
          .map((a): CleanerAssignmentInfo | null => {
            const name = a.cleanerName ?? a.username;
            if (!name) return null;
            const identityKey = a.cleanerProfileId != null
              ? `p:${a.cleanerProfileId}`
              : a.cleanerId != null
                ? `u:${a.cleanerId}`
                : `n:${name}`;
            return { identityKey, name, priority: a.priority ?? 0 };
          })
          .filter((x): x is CleanerAssignmentInfo => x !== null)
          .sort((a, b) => a.priority - b.priority);
        return {
          id: p.id,
          events: (syncRes.events || []) as CalendarEvent[],
          links: (linksRes || []) as CalendarLink[],
          overrides: (ovRes || []) as DateOverride[],
          assignments,
        };
      })
    ).catch(() => []);
    const evMap: Record<number, CalendarEvent[]> = {};
    const lnMap: Record<number, CalendarLink[]> = {};
    const ovMap: Record<number, DateOverride[]> = {};
    const asgMap: Record<number, CleanerAssignmentInfo[]> = {};
    for (const r of results) {
      evMap[r.id] = r.events;
      lnMap[r.id] = r.links;
      ovMap[r.id] = r.overrides;
      if (r.assignments.length > 0) asgMap[r.id] = r.assignments;
    }
    setSyncedEvents(evMap);
    setLinks(lnMap);
    setOverrides(ovMap);
    setAssignmentsByProperty(asgMap);
    setLoading(false);
  }, [properties]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate fetch-on-mount pattern; setState happens inside the async callback
    fetchData();
  }, [fetchData]);

  if (properties.length === 0) {
    return (
      <div className="-mx-3 sm:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-[1760px] px-3 sm:px-5">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-center text-xs text-[var(--ink-4)]">
            {c.emptyState}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
        {/* Mobile-only property switcher at the top of the page — on
            mobile the sidebar (with its own switcher) sits below the
            schedule, so without this the user has to scroll past the
            whole table to change scope. lg:hidden keeps it out of the
            desktop layout where the sidebar switcher is already visible. */}
        {properties.length > 1 && (
          <div className="lg:hidden">
            <PropertySwitcher
              properties={properties}
              selectedPropertyId={null}
              view="cleaning"
              showAllOption
            />
          </div>
        )}
        <div className="min-w-0 lg:flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {c.cleaning}
            </h1>
            <p className="mt-1 text-xs text-[var(--ink-3)]">
              {c.acrossAllProperties(properties.length)}
            </p>
          </div>
          <CleaningSchedule
            properties={properties}
            syncedEvents={syncedEvents}
            links={links}
            overrides={overrides}
            mode="dashboard"
            onOverrideChanged={fetchData}
            includePotential={includePotential}
            onIncludePotentialChange={setIncludePotential}
            cleanerAssignments={assignmentsByProperty}
            loading={loading}
          />
        </div>

        {/* Sidebar — View options + a Data sources note. Copy + Print
            moved to the schedule's table header. Same shell + soft
            shadow as PropertyCleaningView's sidebar so the cleaning
            surface looks consistent across the two scopes. */}
        <aside className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip]">
          <div className="border-b border-[var(--line)] px-5 py-4 space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
                {c.cleaning}
              </div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)] truncate">
                {c.allPropertiesLabel(properties.length)}
              </div>
            </div>
            <PropertySwitcher
              properties={properties}
              selectedPropertyId={null}
              view="cleaning"
              showAllOption
              label={null}
            />
          </div>

          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-2.5">
              {c.view}
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePotential}
                onChange={(e) => setIncludePotential(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--line-2)] accent-[var(--m-accent)] cursor-pointer"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--ink)]">
                  {t("cleaning.includePotential")}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--ink-3)] leading-relaxed">
                  {c.potentialHelper}
                </span>
              </span>
            </label>
          </div>

          <div className="px-5 py-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
              {c.dataSources}
            </div>
            <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
              {c.dataSourcesHelper}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
