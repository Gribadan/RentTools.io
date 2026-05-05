"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";
import { bookingWindowCutoff } from "@/lib/types";

interface CleaningRecord {
  id: number;
  propertyId: number;
  date: string;
  status: "pending" | "done" | "skipped";
  doneAt?: string | null;
  notes?: string;
}

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

type CleaningKind = "after" | "before" | "turnover" | "gap-potential" | "manual";
type BufferMode = "full" | "quick";

interface CleaningDay {
  date: string;
  type: "cleaning" | "potential";
  property: string;
  propertyId: number;
  kind: CleaningKind;
  bufferMode: BufferMode; // "full" = bufferBefore/After ≥ 1, "quick" = same-day turnover
  prevGuest?: string;
  nextGuest?: string;
  manualNote?: string;
  movableTo?: string;
  hoursAvailable?: number; // for buffer=0 turnovers, hours between checkout and next checkin
  isManual?: boolean; // true if created via a "closed" date override
}

interface CleaningScheduleProps {
  properties: Property[];
  syncedEvents: Record<number, CalendarEvent[]>;
  links: Record<number, CalendarLink[]>;
  overrides?: Record<number, DateOverride[]>;
  mode: "property" | "dashboard";
  selectedPropertyId?: number;
  onOverrideChanged?: () => void; // called after add/remove to refresh parent data
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeCleaningDays(
  property: Property,
  events: CalendarEvent[],
  links: CalendarLink[],
  dateOverrides: DateOverride[] = []
): CleaningDay[] {
  const result: CleaningDay[] = [];
  const allBooked = new Set<string>();
  const maxBefore = Math.max(0, ...links.map(l => l.bufferBefore), 0);
  const maxAfter = Math.max(0, ...links.map(l => l.bufferAfter), 0);
  const minStay = property.minNights || 3;

  // Booking window cutoff — ignore events starting beyond this date
  const cutoff = bookingWindowCutoff(property.bookingWindow || 365);

  interface Booking { start: string; end: string; name: string; platform: string }
  const allBookings: Booking[] = [];

  for (const ev of events) {
    if (ev.startDate >= cutoff) continue; // beyond booking window
    let d = ev.startDate;
    while (d <= ev.endDate) { allBooked.add(d); d = addDaysStr(d, 1); }
    // Include ALL events in cleaning computation — host blocks ("Not available"),
    // maintenance blocks, and real bookings all need cleaning after they end.
    // The distinction only matters for iCal FEED export (where host blocks don't
    // generate extra buffer days), not for the cleaning schedule.
    const isAirbnbBlock = ev.platform === "airbnb" && (
      ev.summary.includes("Not available") || ev.summary.includes("Blocked")
    );
    const name = isAirbnbBlock ? "Airbnb block" : ev.summary;
    allBookings.push({ start: ev.startDate, end: ev.endDate, name, platform: ev.platform });
  }

  for (const res of property.reservations) {
    const start = toDateStr(new Date(res.checkIn));
    const end = toDateStr(new Date(res.checkOut));
    let d = start;
    while (d <= end) { allBooked.add(d); d = addDaysStr(d, 1); }
    allBookings.push({ start, end, name: res.name, platform: res.platform || "airbnb" });
  }

  allBookings.sort((a, b) => a.start.localeCompare(b.start));
  const deduped: Booking[] = [];
  for (const b of allBookings) {
    const last = deduped[deduped.length - 1];
    // Strict overlap: b.start < last.end (they share at least one stay day)
    // Back-to-back bookings (b.start === last.end, checkout = next checkin) are NOT merged —
    // they are different guests and we need a cleaning turnover between them.
    if (last && b.start < last.end) {
      if (b.end > last.end) last.end = b.end;
      if (b.name !== "Reserved" && b.name !== "CLOSED - Not available") last.name = b.name;
    } else {
      deduped.push({ ...b });
    }
  }

  const skipBeforeFor = new Set<number>();
  for (let i = 0; i < deduped.length - 1; i++) {
    const gapStart = addDaysStr(deduped[i].end, 1);
    const gapDays = Math.max(0, Math.ceil(
      (new Date(deduped[i + 1].start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
    ));
    if (gapDays < maxAfter + minStay + maxBefore) {
      skipBeforeFor.add(i + 1);
    }
  }

  for (let bi = 0; bi < deduped.length; bi++) {
    const b = deduped[bi];
    const prev = bi > 0 ? deduped[bi - 1] : null;
    const displayName = b.name.includes("CLOSED") || b.name.includes("Reserved")
      ? (b.platform === "airbnb" ? "Airbnb" : "Booking") + " guest"
      : b.name;

    if (!skipBeforeFor.has(bi)) {
      if (bi === 0 || !prev) {
        for (let i = 1; i <= maxBefore; i++) {
          const d = addDaysStr(b.start, -i);
          if (!allBooked.has(d)) {
            result.push({ date: d, type: "cleaning", property: property.name, propertyId: property.id, kind: "before", bufferMode: "full", nextGuest: displayName });
          }
        }
      } else {
        const gapStart = addDaysStr(prev.end, 1);
        let gapHasBooking = false;
        let d = addDaysStr(gapStart, maxAfter);
        while (d < addDaysStr(b.start, -maxBefore)) {
          if (allBooked.has(d)) { gapHasBooking = true; break; }
          d = addDaysStr(d, 1);
        }
        for (let i = 1; i <= maxBefore; i++) {
          const dd = addDaysStr(b.start, -i);
          if (!allBooked.has(dd)) {
            result.push({
              date: dd,
              type: gapHasBooking ? "cleaning" : "potential",
              property: property.name,
              propertyId: property.id,
              kind: gapHasBooking ? "before" : "gap-potential",
              bufferMode: "full",
              nextGuest: displayName,
            });
          }
        }
      }
    }

    for (let i = 1; i <= maxAfter; i++) {
      const d = addDaysStr(b.end, i);
      if (!allBooked.has(d)) {
        result.push({ date: d, type: "cleaning", property: property.name, propertyId: property.id, kind: "after", bufferMode: "full", prevGuest: displayName });
      }
    }
  }

  // Buffer=0 means cleaning happens on the checkout day itself (not a separate day).
  // Always generate a cleaning entry on each checkout day, and if the next guest
  // arrives the same or next day, show the exact hours available.
  if (maxBefore === 0 && maxAfter === 0) {
    const parseTime = (t: string) => {
      const [h, m] = (t || "12:00").split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const checkOutMin = parseTime(property.checkOutTime || "12:00");
    const checkInMin = parseTime(property.checkInTime || "14:00");

    for (let bi = 0; bi < deduped.length; bi++) {
      const b = deduped[bi];
      const next = deduped[bi + 1];
      const displayName = b.name.includes("CLOSED") || b.name.includes("Reserved")
        ? (b.platform === "airbnb" ? "Airbnb" : "Booking") + " guest"
        : b.name;

      let hoursAvailable: number | undefined = undefined;
      let kind: CleaningKind = "after";
      let nextGuest: string | undefined = undefined;

      if (next) {
        // Compute hours between checkout (b.end + checkOutTime) and next checkin (next.start + checkInTime)
        const checkoutDate = new Date(b.end + "T00:00:00Z");
        const checkinDate = new Date(next.start + "T00:00:00Z");
        const diffMs = checkinDate.getTime() - checkoutDate.getTime();
        const diffMinutes = diffMs / 60000 + (checkInMin - checkOutMin);
        const hours = diffMinutes / 60;

        if (hours > 0) {
          nextGuest = next.name.includes("CLOSED") || next.name.includes("Reserved")
            ? (next.platform === "airbnb" ? "Airbnb" : "Booking") + " guest"
            : next.name;
          hoursAvailable = hours;
          kind = "turnover";
        }
      }

      result.push({
        date: b.end,
        type: "cleaning",
        property: property.name,
        propertyId: property.id,
        kind,
        bufferMode: "quick",
        prevGuest: displayName,
        nextGuest,
        hoursAvailable,
      });

      // Potential cleaning: if the gap between this booking and the next is
      // large enough to fit another guest (≥ minNights), a hypothetical gap
      // guest would check out on next.start to make room for the next confirmed guest.
      if (next) {
        const gapStart = addDaysStr(b.end, 1);
        const gapDays = Math.max(0, Math.ceil(
          (new Date(next.start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
        ));
        if (gapDays >= minStay) {
          // Skip if there's already a definite cleaning at next.start
          const alreadyHasCleaning = result.some(r => r.date === next.start && r.type === "cleaning");
          if (!alreadyHasCleaning) {
            const nextDisplayName = next.name.includes("CLOSED") || next.name.includes("Reserved")
              ? (next.platform === "airbnb" ? "Airbnb" : "Booking") + " guest"
              : next.name;
            const diffMinutes = checkInMin - checkOutMin;
            const hours = diffMinutes > 0 ? diffMinutes / 60 : 24 + diffMinutes / 60;
            result.push({
              date: next.start,
              type: "potential",
              property: property.name,
              propertyId: property.id,
              kind: "gap-potential",
              bufferMode: "quick",
              nextGuest: nextDisplayName,
              hoursAvailable: hours > 0 ? hours : undefined,
            });
          }
        }
      }
    }
  }

  // Apply date overrides
  const openDates = new Set(dateOverrides.filter(o => o.type === "open").map(o => o.date));
  const closedDates = dateOverrides.filter(o => o.type === "closed");

  const filtered = result.filter(d => !openDates.has(d.date));

  for (const o of closedDates) {
    if (!filtered.some(d => d.date === o.date)) {
      filtered.push({
        date: o.date,
        type: "cleaning",
        property: property.name,
        propertyId: property.id,
        kind: "manual",
        bufferMode: maxBefore === 0 && maxAfter === 0 ? "quick" : "full",
        manualNote: o.note,
        isManual: true,
      });
    }
  }

  return filtered;
}

export function CleaningSchedule({
  properties,
  syncedEvents,
  links,
  overrides,
  mode,
  selectedPropertyId,
  onOverrideChanged,
}: CleaningScheduleProps) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [records, setRecords] = useState<Record<string, CleaningRecord>>({});

  const propertyIdsKey = useMemo(
    () => properties.map((p) => p.id).sort((a, b) => a - b).join(","),
    [properties]
  );

  const fetchRecords = useCallback(async () => {
    if (!propertyIdsKey) {
      setRecords({});
      return;
    }
    try {
      const res = await fetch(`/api/cleaning-records?propertyIds=${propertyIdsKey}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, CleaningRecord> = {};
      for (const r of (data.records || []) as CleaningRecord[]) {
        map[`${r.propertyId}-${r.date}`] = r;
      }
      setRecords(map);
    } catch {
      // best-effort
    }
  }, [propertyIdsKey]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleMarkStatus = async (
    propertyId: number,
    date: string,
    status: "done" | "skipped" | "pending"
  ) => {
    await fetch("/api/cleaning-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, date, status }),
    });
    fetchRecords();
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addPropertyId, setAddPropertyId] = useState<number | null>(
    mode === "property" && selectedPropertyId ? selectedPropertyId : (properties[0]?.id ?? null)
  );

  // Build a set of dates that are held by a real booking (middle of stay — no cleaning window)
  const isDateFullyBooked = (propertyId: number, date: string): boolean => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return false;
    // Synced events
    const events = syncedEvents[propertyId] || [];
    for (const ev of events) {
      // Skip Airbnb "Not available"/"Blocked" — those are host blocks, can be cleaned over
      const isBlock = ev.platform === "airbnb" && (ev.summary.includes("Not available") || ev.summary.includes("Blocked"));
      if (isBlock) continue;
      // date is fully booked if it's strictly inside the stay (not the checkout day, which allows turnover cleaning)
      if (date >= ev.startDate && date < ev.endDate) return true;
    }
    // Internal reservations
    for (const res of prop.reservations) {
      const rStart = new Date(res.checkIn).toISOString().substring(0, 10);
      const rEnd = new Date(res.checkOut).toISOString().substring(0, 10);
      if (date >= rStart && date < rEnd) return true;
    }
    return false;
  };

  const handleSkip = async (propertyId: number, date: string, isManual: boolean) => {
    if (isManual) {
      // Manual cleaning = DELETE the "closed" override
      await fetch(`/api/date-overrides?propertyId=${propertyId}&date=${date}`, {
        method: "DELETE",
      });
    } else {
      // Auto cleaning = create an "open" override to suppress it
      await fetch("/api/date-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, date, type: "open" }),
      });
    }
    onOverrideChanged?.();
  };

  const handleAddManual = async () => {
    setAddError(null);
    if (!addDate || !addPropertyId) return;
    if (isDateFullyBooked(addPropertyId, addDate)) {
      setAddError(t("cleaning.dateFullyBooked"));
      return;
    }
    await fetch("/api/date-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: addPropertyId,
        date: addDate,
        type: "closed",
        note: addNote.trim() || "Manual cleaning",
      }),
    });
    setAddDate("");
    setAddNote("");
    setShowAddForm(false);
    onOverrideChanged?.();
  };

  const cleaningDays = useMemo(() => {
    const targetProperties = mode === "property" && selectedPropertyId
      ? properties.filter(p => p.id === selectedPropertyId)
      : properties;

    const allDays: CleaningDay[] = [];
    for (const prop of targetProperties) {
      const propEvents = syncedEvents[prop.id] || [];
      const propLinks = links[prop.id] || [];
      const propOverrides = overrides?.[prop.id] || [];
      allDays.push(...computeCleaningDays(prop, propEvents, propLinks, propOverrides));
    }

    allDays.sort((a, b) => a.date.localeCompare(b.date));
    return allDays;
  }, [properties, syncedEvents, links, overrides, mode, selectedPropertyId]);

  const overlaps = useMemo(() => {
    const dateMap = new Map<string, CleaningDay[]>();
    for (const day of cleaningDays) {
      if (day.type !== "cleaning") continue;
      const existing = dateMap.get(day.date) || [];
      existing.push(day);
      dateMap.set(day.date, existing);
    }

    const result: { date: string; properties: string[]; canMove: boolean; moveSuggestion: string }[] = [];
    for (const [date, days] of dateMap) {
      if (days.length <= 1) continue;
      const propNames = [...new Set(days.map(d => d.property))];
      if (propNames.length <= 1) continue;

      const nextDay = addDaysStr(date, 1);
      const allBooked = new Set<string>();
      for (const prop of properties) {
        const propEvents = syncedEvents[prop.id] || [];
        for (const ev of propEvents) {
          if (nextDay >= ev.startDate && nextDay < ev.endDate) allBooked.add(prop.name);
        }
      }
      const canMove = propNames.some(p => !allBooked.has(p));
      result.push({
        date,
        properties: propNames,
        canMove,
        moveSuggestion: canMove ? t("cleaning.moveTo", { date: nextDay }) : t("cleaning.noFreeDay"),
      });
    }
    return result;
  }, [cleaningDays, properties, syncedEvents, t]);

  const todayStr = toDateStr(new Date());
  const futureDays = cleaningDays.filter(d => d.date >= todayStr);
  const futureOverlaps = overlaps.filter(o => o.date >= todayStr);

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" };
    if (dateYear !== currentYear) opts.year = "numeric";
    return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", opts);
  };

  const formatReason = (day: CleaningDay): string => {
    if (day.isManual) return day.manualNote?.trim() || t("cleaning.manualCleaning");
    switch (day.kind) {
      case "after":
        // bufferMode="quick" = same-day; "full" = dedicated day after checkout
        return day.bufferMode === "quick"
          ? t("cleaning.afterGuestQuick", { name: day.prevGuest || "—" })
          : t("cleaning.afterGuest", { name: day.prevGuest || "—" });
      case "before":
        return t("cleaning.beforeGuest", { name: day.nextGuest || "—" });
      case "turnover":
        return t("cleaning.turnover", { from: day.prevGuest || "—", to: day.nextGuest || "—" });
      case "gap-potential":
        return t("cleaning.gapPotential", { name: day.nextGuest || "—" });
      default:
        return "";
    }
  };

  const formatHours = (h: number): string => {
    if (h < 24) {
      const rounded = h < 10 ? h.toFixed(1) : Math.round(h).toString();
      return t("cleaning.hoursShort", { h: rounded });
    }
    const days = Math.round(h / 24);
    return t("cleaning.daysShort", { d: days });
  };

  const handleCopySchedule = () => {
    const lines: string[] = [];
    lines.push(locale === "ru" ? "📋 График уборок:" : "📋 Cleaning Schedule:");
    lines.push("");
    for (const day of futureDays) {
      const dateStr = formatDate(day.date);
      const typeLabel = day.type === "cleaning"
        ? (locale === "ru" ? "🧹 Уборка" : "🧹 Cleaning")
        : (locale === "ru" ? "❓ Возможная" : "❓ Potential");
      const propLabel = mode === "dashboard" ? ` [${day.property}]` : "";
      const hoursLabel = day.hoursAvailable !== undefined
        ? ` ⏱ ${formatHours(day.hoursAvailable)}`
        : "";
      const reasonText = formatReason(day);
      lines.push(`${dateStr}${propLabel} — ${typeLabel}${hoursLabel}${reasonText ? " — " + reasonText : ""}`);
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Overlap warnings */}
      {futureOverlaps.length > 0 && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-amber-400">
              {t("cleaning.overlapWarning")} ({futureOverlaps.length} {locale === "ru" ? (futureOverlaps.length === 1 ? "день" : "дней") : (futureOverlaps.length === 1 ? "day" : "days")})
            </span>
          </div>
          <p className="text-xs text-amber-400/80">
            {t("cleaning.overlapDesc")}
          </p>
          {futureOverlaps.map(o => (
            <div key={o.date} className="flex items-center gap-3 text-xs">
              <span className="font-medium text-[var(--ink)]">{formatDate(o.date)}</span>
              <span className="text-[var(--ink-3)]">{o.properties.join(" + ")}</span>
              <span className={o.canMove ? "text-emerald-500" : "text-rose-500"}>
                {o.moveSuggestion}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Schedule table */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
        <div className="border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--ink-3)]">
            {t("cleaning.title")} ({futureDays.length} {t("cleaning.upcoming")})
          </h2>
          <div className="flex items-center gap-2">
            {onOverrideChanged && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--line-2)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:bg-[var(--line-2)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t("cleaning.addManual")}
              </button>
            )}
            {futureDays.length > 0 && (
              <button
                onClick={handleCopySchedule}
                className="flex items-center gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--line-2)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:bg-[var(--line-2)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                {copied ? t("common.copied") : t("cleaning.copySchedule")}
              </button>
            )}
          </div>
        </div>

        {/* Add manual cleaning form */}
        {showAddForm && (
          <div className="border-b border-[var(--line)] bg-[var(--bg)] px-4 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {mode === "dashboard" && (
                <select
                  value={addPropertyId ?? ""}
                  onChange={(e) => { setAddPropertyId(Number(e.target.value)); setAddError(null); }}
                  className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                >
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <input
                type="date"
                value={addDate}
                onChange={(e) => { setAddDate(e.target.value); setAddError(null); }}
                className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              />
              <input
                type="text"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
                placeholder={t("cleaning.addManualNote")}
                className="h-8 flex-1 min-w-[200px] rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)]"
              />
              <button
                onClick={handleAddManual}
                disabled={!addDate || !addPropertyId}
                className="h-8 rounded-md bg-[var(--m-accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-40"
              >
                {t("common.add")}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddDate(""); setAddNote(""); setAddError(null); }}
                className="h-8 rounded-md px-2 text-xs text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                {t("common.cancel")}
              </button>
            </div>
            {addError && (
              <p className="text-xs text-rose-500">{addError}</p>
            )}
          </div>
        )}
        {futureDays.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title={t("empty.cleaning.title")}
              description={t("empty.cleaning.desc")}
            />
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {/* Mobile card list — stacks within 375px without horizontal scroll */}
            <div className="sm:hidden">
              {futureDays.map((day, i) => {
                const isOverlap = futureOverlaps.some(o => o.date === day.date);
                const prevYear = i > 0 ? futureDays[i - 1].date.substring(0, 4) : day.date.substring(0, 4);
                const thisYear = day.date.substring(0, 4);
                const showYearDivider = thisYear !== prevYear;
                const rec = records[`${day.propertyId}-${day.date}`];
                const isDone = rec?.status === "done";
                return (
                  <div key={`m-${day.date}-${day.propertyId}-${i}`}>
                    {showYearDivider && (
                      <div className="border-b border-[var(--line)] bg-[var(--bg-3)] px-4 py-2 text-xs font-semibold text-[var(--ink-3)]">
                        {thisYear}
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 border-b border-[var(--line)]/50 px-4 py-3 ${isOverlap ? "bg-amber-400/5" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--ink)] whitespace-nowrap">
                          {formatDate(day.date)}
                          {isOverlap && (
                            <span className="ml-1.5 text-[10px] font-medium text-amber-400">
                              {t("cleaning.overlap")}
                            </span>
                          )}
                        </span>
                        {onOverrideChanged && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleMarkStatus(day.propertyId, day.date, isDone ? "pending" : "done")
                              }
                              title={isDone ? (locale === "ru" ? "Отменить" : "Undo") : (locale === "ru" ? "Сделано" : "Done")}
                              className={
                                "rounded p-1.5 transition-colors " +
                                (isDone
                                  ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                  : "text-[var(--ink-4)] hover:bg-emerald-500/10 hover:text-emerald-500")
                              }
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleSkip(day.propertyId, day.date, !!day.isManual)}
                              title={t("cleaning.skip")}
                              className="rounded p-1.5 text-[var(--ink-4)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${
                          day.type === "cleaning"
                            ? "bg-amber-400/10 text-amber-400"
                            : "bg-[var(--ink)]/10 text-[var(--ink)]"
                        }`}>
                          {day.type === "cleaning" ? t("cleaning.typeClean") : t("cleaning.typePotential")}
                        </span>
                        {rec?.status === "done" && (
                          <span className="inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 font-medium text-emerald-500">
                            {locale === "ru" ? "Сделано" : "Done"}
                          </span>
                        )}
                        {rec?.status === "skipped" && (
                          <span className="inline-block rounded bg-[var(--ink-4)]/20 px-1.5 py-0.5 font-medium text-[var(--ink-3)]">
                            {locale === "ru" ? "Пропущено" : "Skipped"}
                          </span>
                        )}
                        {mode === "dashboard" && (
                          <span className="text-[var(--ink-3)]">{day.property}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {day.isManual && (
                          <span className="inline-block rounded bg-[var(--ink)]/10 px-1.5 py-0.5 font-medium text-[var(--ink)]">
                            {t("cleaning.manual")}
                          </span>
                        )}
                        {!day.isManual && (
                          <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${
                            day.bufferMode === "quick"
                              ? "bg-violet-400/10 text-violet-400"
                              : "bg-amber-400/10 text-amber-400"
                          }`}>
                            {day.bufferMode === "quick" ? t("cleaning.quickTurnover") : t("cleaning.fullDay")}
                          </span>
                        )}
                        {day.hoursAvailable !== undefined && (
                          <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-500">
                            {formatHours(day.hoursAvailable)}
                          </span>
                        )}
                        <span className="text-[var(--ink-2)]">{formatReason(day)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-[var(--line)] text-left">
                  <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)] w-[140px]">{t("cleaning.date")}</th>
                  <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)]">{t("cleaning.type")}</th>
                  {mode === "dashboard" && (
                    <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)]">{t("cleaning.property")}</th>
                  )}
                  <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)]">{t("cleaning.notes")}</th>
                  {onOverrideChanged && (
                    <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)] w-[60px]"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {futureDays.map((day, i) => {
                  const isOverlap = futureOverlaps.some(o => o.date === day.date);
                  const prevYear = i > 0 ? futureDays[i - 1].date.substring(0, 4) : day.date.substring(0, 4);
                  const thisYear = day.date.substring(0, 4);
                  const showYearDivider = thisYear !== prevYear;
                  return (
                    <>{showYearDivider && (
                      <tr key={`year-${thisYear}`} className="border-b border-[var(--line)]">
                        <td colSpan={10} className="px-4 py-2 text-xs font-semibold text-[var(--ink-3)] bg-[var(--bg-3)]">{thisYear}</td>
                      </tr>
                    )}
                    <tr key={`${day.date}-${day.propertyId}-${i}`} className={`border-b border-[var(--line)]/50 ${isOverlap ? "bg-amber-400/5" : "hover:bg-[var(--bg-3)]"}`}>
                      <td className="px-4 py-2 text-sm text-[var(--ink)] whitespace-nowrap">
                        {formatDate(day.date)}
                        {isOverlap && <span className="ml-1.5 text-[10px] text-amber-400 font-medium">{t("cleaning.overlap")}</span>}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                            day.type === "cleaning"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-[var(--ink)]/10 text-[var(--ink)]"
                          }`}>
                            {day.type === "cleaning" ? t("cleaning.typeClean") : t("cleaning.typePotential")}
                          </span>
                          {(() => {
                            const rec = records[`${day.propertyId}-${day.date}`];
                            if (rec?.status === "done") {
                              return (
                                <span className="inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-500">
                                  {locale === "ru" ? "Сделано" : "Done"}
                                </span>
                              );
                            }
                            if (rec?.status === "skipped") {
                              return (
                                <span className="inline-block rounded bg-[var(--ink-4)]/20 px-1.5 py-0.5 text-xs font-medium text-[var(--ink-3)]">
                                  {locale === "ru" ? "Пропущено" : "Skipped"}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      {mode === "dashboard" && (
                        <td className="px-4 py-2 text-sm text-[var(--ink-3)]">{day.property}</td>
                      )}
                      <td className="px-4 py-2 text-xs text-[var(--ink-3)]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {day.isManual && (
                            <span className="inline-block rounded bg-[var(--ink)]/10 px-1.5 py-0.5 text-[var(--ink)] font-medium">
                              {t("cleaning.manual")}
                            </span>
                          )}
                          {!day.isManual && (
                            <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${
                              day.bufferMode === "quick"
                                ? "bg-violet-400/10 text-violet-400"
                                : "bg-amber-400/10 text-amber-400"
                            }`}>
                              {day.bufferMode === "quick" ? t("cleaning.quickTurnover") : t("cleaning.fullDay")}
                            </span>
                          )}
                          {day.hoursAvailable !== undefined && (
                            <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-500 font-medium">
                              {formatHours(day.hoursAvailable)}
                            </span>
                          )}
                          <span className="text-[var(--ink-2)]">{formatReason(day)}</span>
                        </div>
                      </td>
                      {onOverrideChanged && (
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(() => {
                              const rec = records[`${day.propertyId}-${day.date}`];
                              const isDone = rec?.status === "done";
                              return (
                                <button
                                  onClick={() =>
                                    handleMarkStatus(
                                      day.propertyId,
                                      day.date,
                                      isDone ? "pending" : "done"
                                    )
                                  }
                                  title={isDone ? (locale === "ru" ? "Отменить" : "Undo") : (locale === "ru" ? "Сделано" : "Done")}
                                  className={
                                    "rounded p-1 transition-colors " +
                                    (isDone
                                      ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                      : "text-[var(--ink-4)] hover:bg-emerald-500/10 hover:text-emerald-500")
                                  }
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => handleSkip(day.propertyId, day.date, !!day.isManual)}
                              title={t("cleaning.skip")}
                              className="rounded p-1 text-[var(--ink-4)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
