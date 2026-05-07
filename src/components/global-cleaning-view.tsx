"use client";

import { useCallback, useEffect, useState } from "react";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { PropertySwitcher } from "@/components/property-switcher";
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
  const [includePotential, setIncludePotential] = useState(true);
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
