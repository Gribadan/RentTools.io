"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";
import { bookingWindowCutoff } from "@/lib/types";

/** Imperative API exposed via ref. Lets parents (e.g. PropertyCleaningView)
 *  drive Copy / Print from a sidebar that lives outside this component
 *  while the internal state and computations stay co-located here. */
export interface CleaningScheduleHandle {
  copy: () => void;
  print: () => void;
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
  hoursAvailable?: number; // only when meaningful (< 24h, true same-day turnover)
  isManual?: boolean; // true if created via a "closed" date override
  // Context dates that drive the date-specific reason text. Keeping them
  // on the row means formatReason can be a pure function.
  prevEndDate?: string;     // checkout date of prev booking
  nextStartDate?: string;   // checkin date of next booking
  gapStartDate?: string;    // first day of bookable gap (gap-potential only)
  gapEndDate?: string;      // last day of bookable gap (gap-potential only)
}

interface CleaningScheduleProps {
  properties: Property[];
  syncedEvents: Record<number, CalendarEvent[]>;
  links: Record<number, CalendarLink[]>;
  overrides?: Record<number, DateOverride[]>;
  mode: "property" | "dashboard";
  selectedPropertyId?: number;
  // Kept on the prop signature so existing call sites compile, but the
  // page is now informational — no add/remove/done/skip actions live here.
  onOverrideChanged?: () => void;
  /** Hide the inline header controls (toggle / Copy / Print). Used when
   *  the parent renders its own controls in a sidebar. */
  hideControls?: boolean;
  /** Controlled value for the include-potential toggle. When provided,
   *  the internal state is bypassed. Pair with onIncludePotentialChange. */
  includePotential?: boolean;
  onIncludePotentialChange?: (value: boolean) => void;
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
    if (ev.startDate >= cutoff) continue;
    let d = ev.startDate;
    while (d <= ev.endDate) { allBooked.add(d); d = addDaysStr(d, 1); }
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
            result.push({
              date: d,
              type: "cleaning",
              property: property.name,
              propertyId: property.id,
              kind: "before",
              bufferMode: "full",
              nextGuest: displayName,
              nextStartDate: b.start,
            });
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
        // Bookable gap window for the "if a gap guest landed here" note —
        // exclude buffer days on either side.
        const gapBookableStart = addDaysStr(prev.end, maxAfter + 1);
        const gapBookableEnd = addDaysStr(b.start, -(maxBefore + 1));
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
              nextStartDate: b.start,
              gapStartDate: gapHasBooking ? undefined : gapBookableStart,
              gapEndDate: gapHasBooking ? undefined : gapBookableEnd,
            });
          }
        }
      }
    }

    for (let i = 1; i <= maxAfter; i++) {
      const d = addDaysStr(b.end, i);
      if (!allBooked.has(d)) {
        result.push({
          date: d,
          type: "cleaning",
          property: property.name,
          propertyId: property.id,
          kind: "after",
          bufferMode: "full",
          prevGuest: displayName,
          prevEndDate: b.end,
        });
      }
    }
  }

  // Buffer=0 means cleaning happens on the checkout day itself.
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
      let nextStartDate: string | undefined = undefined;

      if (next) {
        nextGuest = next.name.includes("CLOSED") || next.name.includes("Reserved")
          ? (next.platform === "airbnb" ? "Airbnb" : "Booking") + " guest"
          : next.name;
        nextStartDate = next.start;

        // True turnover only when the next guest checks in on the same
        // calendar day the previous one checked out — otherwise it's an
        // "after" cleaning that just happens to know about a future
        // arrival (no need to call it a turnover or surface a "97 days"
        // chip that confuses readers).
        if (next.start === b.end) {
          kind = "turnover";
          const diffMinutes = checkInMin - checkOutMin;
          const hours = diffMinutes > 0 ? diffMinutes / 60 : 24 + diffMinutes / 60;
          if (hours > 0 && hours < 24) hoursAvailable = hours;
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
        prevEndDate: b.end,
        nextGuest,
        nextStartDate,
        hoursAvailable,
      });

      if (next) {
        const gapStart = addDaysStr(b.end, 1);
        const gapDays = Math.max(0, Math.ceil(
          (new Date(next.start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
        ));
        if (gapDays >= minStay) {
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
              nextStartDate: next.start,
              gapStartDate: gapStart,
              gapEndDate: addDaysStr(next.start, -1),
              hoursAvailable: hours > 0 && hours < 24 ? hours : undefined,
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

export const CleaningSchedule = forwardRef<CleaningScheduleHandle, CleaningScheduleProps>(function CleaningScheduleImpl({
  properties,
  syncedEvents,
  links,
  overrides,
  mode,
  selectedPropertyId,
  hideControls = false,
  includePotential: controlledIncludePotential,
  onIncludePotentialChange,
}, ref) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [internalIncludePotential, setInternalIncludePotential] = useState(true);
  // Controlled when the prop is provided; otherwise fall back to local state
  // so existing inline call sites keep working unchanged.
  const includePotential = controlledIncludePotential ?? internalIncludePotential;
  const setIncludePotential = (v: boolean) => {
    if (onIncludePotentialChange) onIncludePotentialChange(v);
    if (controlledIncludePotential === undefined) setInternalIncludePotential(v);
  };

  const cleaningDays = useMemo(() => {
    const targetProperties = mode === "property" && selectedPropertyId
      ? properties.filter(p => p.id === selectedPropertyId)
      : properties;

    const allDays: CleaningDay[] = [];
    for (const prop of targetProperties) {
      // RT-25.3 — properties with the cleaning toggle off contribute no rows.
      if (prop.cleaningEnabled === false) continue;
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

  // Days that the user-facing list / copy / print actually show — gated
  // by the "Include potential" toggle.
  const visibleDays = useMemo(
    () => (includePotential ? futureDays : futureDays.filter(d => d.type !== "potential")),
    [futureDays, includePotential]
  );

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" };
    if (dateYear !== currentYear) opts.year = "numeric";
    return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", opts);
  };

  // Compact "May 14" / "14 May" for inline date references inside notes.
  const formatShortDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
    if (dateYear !== currentYear) opts.year = "numeric";
    return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", opts);
  };

  const formatReason = (day: CleaningDay): string => {
    if (day.isManual) return day.manualNote?.trim() || t("cleaning.manualCleaning");

    switch (day.kind) {
      case "after": {
        // bufferMode="quick" = cleaning on the checkout day itself; the
        // row date already shows the checkout, so we only add the
        // "next guest arrives DATE" hint when one is coming.
        if (day.bufferMode === "quick") {
          if (day.nextGuest && day.nextStartDate) {
            return t("cleaning.afterGuestQuickWithNext", {
              name: day.prevGuest || "—",
              next: day.nextGuest,
              date: formatShortDate(day.nextStartDate),
            });
          }
          return t("cleaning.afterGuestQuick", { name: day.prevGuest || "—" });
        }
        // Full-day after — the cleaning is N days past checkout, so call
        // out the actual checkout date so "after WHO and WHEN" is clear.
        if (day.prevEndDate) {
          return t("cleaning.afterGuestFull", {
            name: day.prevGuest || "—",
            date: formatShortDate(day.prevEndDate),
          });
        }
        return t("cleaning.afterGuest", { name: day.prevGuest || "—" });
      }
      case "before": {
        if (day.nextStartDate) {
          return t("cleaning.beforeGuestFull", {
            name: day.nextGuest || "—",
            date: formatShortDate(day.nextStartDate),
          });
        }
        return t("cleaning.beforeGuest", { name: day.nextGuest || "—" });
      }
      case "turnover":
        return t("cleaning.turnover", { from: day.prevGuest || "—", to: day.nextGuest || "—" });
      case "gap-potential": {
        if (day.gapStartDate && day.gapEndDate && day.nextStartDate && day.nextGuest) {
          // Single-day gap — drop the dash so the note reads naturally.
          const gapText = day.gapStartDate === day.gapEndDate
            ? formatShortDate(day.gapStartDate)
            : `${formatShortDate(day.gapStartDate)} – ${formatShortDate(day.gapEndDate)}`;
          return t("cleaning.gapPotentialSpecific", {
            gap: gapText,
            name: day.nextGuest,
            date: formatShortDate(day.nextStartDate),
          });
        }
        return t("cleaning.gapPotential", { name: day.nextGuest || "—" });
      }
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

  // Build the line-per-day plain-text schedule that copy AND print share.
  // For single-property mode the property name lands in the header so a
  // pasted Telegram / email message identifies the place at a glance.
  // For dashboard mode the [Property] tag on each row already carries
  // that information.
  const buildScheduleLines = (): string[] => {
    const targetProperties = mode === "property" && selectedPropertyId
      ? properties.filter(p => p.id === selectedPropertyId)
      : properties;
    const singlePropertyName = mode === "property" && targetProperties.length === 1
      ? targetProperties[0].name
      : null;
    const headerSuffix = singlePropertyName ? ` — ${singlePropertyName}` : "";

    const lines: string[] = [];
    lines.push(
      (locale === "ru" ? "📋 График уборок" : "📋 Cleaning Schedule") + headerSuffix
    );
    lines.push("");
    for (const day of visibleDays) {
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
    return lines;
  };

  const handleCopySchedule = () => {
    navigator.clipboard.writeText(buildScheduleLines().join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSchedule = () => {
    const lines = buildScheduleLines();
    // Render in a separate window so the rest of the dashboard chrome
    // doesn't pollute the printout. Same plain-text format the copy
    // produces; just wrapped in a <pre> so the printer respects line
    // breaks.
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    const escapeHtml = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
      );
    const titleText = t("cleaning.title");
    w.document.write(`<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(titleText)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; font-size: 12px; color: #111; margin: 24px; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 12px; line-height: 1.55; margin: 0; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
<pre>${escapeHtml(lines.join("\n"))}</pre>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 100); };</script>
</body>
</html>`);
    w.document.close();
  };

  // Expose copy / print so a sidebar in PropertyCleaningView can drive
  // them while the underlying state and computations stay local.
  useImperativeHandle(ref, () => ({
    copy: handleCopySchedule,
    print: handlePrintSchedule,
  }));

  return (
    <div className="space-y-4">
      {/* Overlap warnings */}
      {futureOverlaps.length > 0 && (
        <div className="rounded-lg border border-[var(--cleaning-border)] bg-[var(--cleaning-bg)] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[var(--cleaning-fg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-[var(--cleaning-fg)]">
              {t("cleaning.overlapWarning")} ({futureOverlaps.length} {locale === "ru" ? (futureOverlaps.length === 1 ? "день" : "дней") : (futureOverlaps.length === 1 ? "day" : "days")})
            </span>
          </div>
          <p className="text-xs text-[var(--cleaning-fg)] opacity-80">
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
        <div className="border-b border-[var(--line)] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--ink-3)]">
            {t("cleaning.title")} ({visibleDays.length} {t("cleaning.upcoming")})
          </h2>
          {!hideControls && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Include-potential toggle. Default ON; gates the visible
                  list, the copy output, and the print output uniformly. */}
              <label className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePotential}
                  onChange={(e) => setIncludePotential(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[var(--line-2)] accent-[var(--m-accent)] cursor-pointer"
                />
                {t("cleaning.includePotential")}
              </label>
              {visibleDays.length > 0 && (
                <>
                  <button
                    onClick={handleCopySchedule}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--line-2)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:bg-[var(--line-2)]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    {copied ? t("common.copied") : t("cleaning.copySchedule")}
                  </button>
                  <button
                    onClick={handlePrintSchedule}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--line-2)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:bg-[var(--line-2)]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                    </svg>
                    {t("cleaning.printSchedule")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {visibleDays.length === 0 ? (
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
            {/* Mobile card list */}
            <div className="sm:hidden">
              {visibleDays.map((day, i) => {
                const isOverlap = futureOverlaps.some(o => o.date === day.date);
                const prevYear = i > 0 ? visibleDays[i - 1].date.substring(0, 4) : day.date.substring(0, 4);
                const thisYear = day.date.substring(0, 4);
                const showYearDivider = thisYear !== prevYear;
                return (
                  <div key={`m-${day.date}-${day.propertyId}-${i}`}>
                    {showYearDivider && (
                      <div className="border-b border-[var(--line)] bg-[var(--bg-3)] px-4 py-2 text-xs font-semibold text-[var(--ink-3)]">
                        {thisYear}
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 border-b border-[var(--line)]/50 px-4 py-3 ${isOverlap ? "bg-[var(--cleaning-cell-bg)]" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--ink)] whitespace-nowrap">
                          {formatDate(day.date)}
                          {isOverlap && (
                            <span className="ml-1.5 text-[10px] font-medium text-[var(--cleaning-fg)]">
                              {t("cleaning.overlap")}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${
                          day.type === "cleaning"
                            ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)] border border-[var(--cleaning-border)]"
                            : "bg-[var(--ink)]/10 text-[var(--ink)]"
                        }`}>
                          {day.type === "cleaning" ? t("cleaning.typeClean") : t("cleaning.typePotential")}
                        </span>
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
                              : "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)] border border-[var(--cleaning-border)]"
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
                </tr>
              </thead>
              <tbody>
                {visibleDays.map((day, i) => {
                  const isOverlap = futureOverlaps.some(o => o.date === day.date);
                  const prevYear = i > 0 ? visibleDays[i - 1].date.substring(0, 4) : day.date.substring(0, 4);
                  const thisYear = day.date.substring(0, 4);
                  const showYearDivider = thisYear !== prevYear;
                  return (
                    <>{showYearDivider && (
                      <tr key={`year-${thisYear}`} className="border-b border-[var(--line)]">
                        <td colSpan={10} className="px-4 py-2 text-xs font-semibold text-[var(--ink-3)] bg-[var(--bg-3)]">{thisYear}</td>
                      </tr>
                    )}
                    <tr key={`${day.date}-${day.propertyId}-${i}`} className={`border-b border-[var(--line)]/50 ${isOverlap ? "bg-[var(--cleaning-cell-bg)]" : "hover:bg-[var(--bg-3)]"}`}>
                      <td className="px-4 py-2 text-sm text-[var(--ink)] whitespace-nowrap">
                        {formatDate(day.date)}
                        {isOverlap && <span className="ml-1.5 text-[10px] text-[var(--cleaning-fg)] font-medium">{t("cleaning.overlap")}</span>}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          day.type === "cleaning"
                            ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)] border border-[var(--cleaning-border)]"
                            : "bg-[var(--ink)]/10 text-[var(--ink)]"
                        }`}>
                          {day.type === "cleaning" ? t("cleaning.typeClean") : t("cleaning.typePotential")}
                        </span>
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
                                : "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)] border border-[var(--cleaning-border)]"
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
});
