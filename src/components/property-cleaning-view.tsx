"use client";

import { useState, useEffect, useCallback } from "react";
import { CleaningSchedule } from "@/components/cleaning-schedule";
import { CleaningSummary } from "@/components/cleaning-summary";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface PropertyCleaningViewProps {
  property: Property;
}

export function PropertyCleaningView({ property }: PropertyCleaningViewProps) {
  const { locale } = useI18n();
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [syncRes, linksRes, ovRes] = await Promise.all([
      fetch(`/api/calendar/sync?propertyId=${property.id}&limit=200`).then(r => r.json()),
      fetch(`/api/calendar/links?propertyId=${property.id}`).then(r => r.json()),
      fetch(`/api/date-overrides?propertyId=${property.id}`).then(r => r.json()),
    ]);
    setSyncedEvents(syncRes.events || []);
    setLinks(linksRes || []);
    setOverrides(ovRes || []);
  }, [property.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="cls-isolate mx-auto max-w-5xl">
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setSummaryOpen(true)}
          className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--line-2)]"
        >
          {locale === "ru" ? "Краткий план / печать" : "Summary / print"}
        </button>
      </div>
      <CleaningSchedule
        properties={[property]}
        syncedEvents={{ [property.id]: syncedEvents }}
        links={{ [property.id]: links }}
        overrides={{ [property.id]: overrides }}
        mode="property"
        selectedPropertyId={property.id}
        onOverrideChanged={fetchData}
      />
      <CleaningSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        properties={[property]}
        syncedEvents={{ [property.id]: syncedEvents }}
        links={{ [property.id]: links }}
        overrides={{ [property.id]: overrides }}
      />
    </div>
  );
}
