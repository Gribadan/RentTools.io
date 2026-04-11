"use client";

import { useState, useEffect, useCallback } from "react";
import { CleaningSchedule } from "@/components/cleaning-schedule";
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
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);

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
    <div className="mx-auto max-w-5xl">
      <CleaningSchedule
        properties={[property]}
        syncedEvents={{ [property.id]: syncedEvents }}
        links={{ [property.id]: links }}
        overrides={{ [property.id]: overrides }}
        mode="property"
        selectedPropertyId={property.id}
        onOverrideChanged={fetchData}
      />
    </div>
  );
}
