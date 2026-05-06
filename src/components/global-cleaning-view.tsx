"use client";

import { useCallback, useEffect, useState } from "react";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

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
  const { locale } = useI18n();
  const [syncedEvents, setSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [links, setLinks] = useState<Record<number, CalendarLink[]>>({});
  const [overrides, setOverrides] = useState<Record<number, DateOverride[]>>({});
  const [assignmentsByProperty, setAssignmentsByProperty] = useState<Record<number, CleanerAssignmentInfo[]>>({});

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
            {locale === "ru"
              ? "Добавьте объект, чтобы увидеть расписание уборок."
              : "Add a property to see the cleaning schedule."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 space-y-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
            {locale === "ru" ? "Уборки" : "Cleaning"}
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-3)]">
            {locale === "ru"
              ? `По всем объектам (${properties.length})`
              : `Across all ${properties.length} ${properties.length === 1 ? "property" : "properties"}`}
          </p>
        </div>
        <CleaningSchedule
          properties={properties}
          syncedEvents={syncedEvents}
          links={links}
          overrides={overrides}
          mode="dashboard"
          onOverrideChanged={fetchData}
          cleanerAssignments={assignmentsByProperty}
        />
      </div>
    </div>
  );
}
