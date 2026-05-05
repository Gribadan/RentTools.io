"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarNavigation } from "@/components/calendar/calendar-navigation";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarDatePopover } from "@/components/calendar/calendar-date-popover";
import { BarClaimPopover, type ClaimableBar } from "@/components/calendar/bar-claim-popover";
import { AgendaList } from "@/components/calendar/agenda-list";
import { ConflictBanner } from "@/components/calendar/conflict-banner";
import { useCalendarFetch } from "@/components/calendar/use-calendar-fetch";
import { useCalendarData } from "@/components/calendar/use-calendar-data";
import { buildCalendarExportText } from "@/components/calendar/calendar-export";
import { addDaysStr } from "@/components/calendar/utils";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/lib/i18n/context";

interface PropertyCalendarProps {
  property: Property;
  /** Active month as `YYYY-MM` (e.g. "2026-09"). Lifted to the URL by
   *  the dashboard so it survives unmount when the user navigates to
   *  a guest view and back. `null` defaults to the current month. */
  monthParam: string | null;
  onMonthChange: (month: string | null) => void;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
}

const MONTH_PARAM_RE = /^(\d{4})-(\d{2})$/;

function parseMonthParam(s: string | null, fallback: Date): Date {
  if (!s) return fallback;
  const m = MONTH_PARAM_RE.exec(s);
  if (!m) return fallback;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return fallback;
  return new Date(year, month, 1);
}

function formatMonthParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PropertyCalendar({
  property,
  monthParam,
  onMonthChange,
  onSelectReservation,
  onAddReservation,
}: PropertyCalendarProps) {
  const { locale, t } = useI18n();
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);
  const [claimBar, setClaimBar] = useState<ClaimableBar | null>(null);
  const [claimAnchor, setClaimAnchor] = useState<DOMRect | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  const { syncedEvents, links, overrides, loadingEvents, syncing, refetchOverrides, handleSyncNow } =
    useCalendarFetch(property.id);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Source of truth: URL `month` param. monthOffset is computed from
  // currentMonth - today so the existing nav (prev / next / today)
  // can keep talking in offsets without re-architecting.
  const currentMonthBase = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const currentMonth = useMemo(
    () => parseMonthParam(monthParam, currentMonthBase),
    [monthParam, currentMonthBase]
  );
  const monthOffset =
    (currentMonth.getFullYear() - today.getFullYear()) * 12 +
    (currentMonth.getMonth() - today.getMonth());

  const setMonthOffset = useCallback((updater: number | ((prev: number) => number)) => {
    const newOffset = typeof updater === "function" ? updater(monthOffset) : updater;
    const next = new Date(today.getFullYear(), today.getMonth() + newOffset, 1);
    // Drop the param when on the current month so the URL stays clean.
    onMonthChange(newOffset === 0 ? null : formatMonthParam(next));
  }, [monthOffset, today, onMonthChange]);

  const monthLabel = currentMonth.toLocaleDateString(
    locale === "ru" ? "ru-RU" : "en",
    { month: "long", year: "numeric" }
  );

  const data = useCalendarData(property, syncedEvents, links, overrides);

  const closePopover = () => {
    setPopoverDate(null);
    setPopoverAnchor(null);
  };

  const closeClaim = () => {
    setClaimBar(null);
    setClaimAnchor(null);
  };

  const claimSyncedBooking = async (name: string) => {
    if (!claimBar) return;
    await fetch(`/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        checkIn: claimBar.startDate,
        checkOut: claimBar.endDate,
        platform: claimBar.platform,
        propertyId: property.id,
        linkedEventUid: claimBar.eventUid,
      }),
    });
    closeClaim();
    window.location.reload();
  };

  const setOverride = async (dateStr: string, type: "open" | "closed" | "cleaning") => {
    await fetch(`/api/date-overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, date: dateStr, type }),
    });
    await refetchOverrides();
    closePopover();
  };

  const deleteOverride = async (dateStr: string) => {
    await fetch(`/api/date-overrides?propertyId=${property.id}&date=${dateStr}`, { method: "DELETE" });
    await refetchOverrides();
    closePopover();
  };

  const extendBooking = async (dateStr: string, booking: ExtendableBooking) => {
    await fetch(`/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: booking.name,
        checkIn: dateStr,
        checkOut: addDaysStr(dateStr, 1),
        platform: booking.platform,
        propertyId: property.id,
        linkedEventUid: booking.eventUid,
      }),
    });
    closePopover();
    window.location.reload();
  };

  useEffect(() => {
    const isTyping = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      return t.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setMonthOffset((o) => o - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setMonthOffset((o) => o + 1);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setMonthOffset(0);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // setMonthOffset is a useCallback that closes over the current
    // monthOffset, so we re-attach the listener whenever it changes
    // — otherwise ArrowLeft / ArrowRight would step from a stale
    // monthOffset captured at first render.
  }, [setMonthOffset]);

  const handleExport = () => {
    const text = buildCalendarExportText({
      property, monthLabel, today, syncedEvents, links,
      bars: data.bars,
      bufferDates: data.bufferDates,
      potentialDates: data.potentialDates,
      unbookableDates: data.unbookableDates,
      conflicts: data.conflicts,
    });
    navigator.clipboard.writeText(text);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <CalendarToolbar
        property={property}
        links={links}
        syncing={syncing}
        exportCopied={exportCopied}
        today={today}
        onSyncNow={handleSyncNow}
        onExport={handleExport}
        onAddReservation={onAddReservation}
      />
      <ConflictBanner conflicts={data.conflicts} />
      {!loadingEvents &&
        property.reservations.length === 0 &&
        syncedEvents.length === 0 &&
        links.length === 0 && (
          <div className="cls-isolate animate-slide-down">
            <EmptyState
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V10.5h18v8.25" />
                </svg>
              }
              title={t("empty.calendar.title")}
              description={t("empty.calendar.desc")}
            />
          </div>
        )}
      <div className="cls-isolate hidden sm:block rounded-lg border border-[var(--line)] bg-[var(--bg-2)] [overflow:clip] [overflow-clip-margin:12px]">
        <CalendarNavigation
          monthLabel={monthLabel}
          monthOffset={monthOffset}
          loading={loadingEvents}
          onPrev={() => setMonthOffset(o => o - 1)}
          onNext={() => setMonthOffset(o => o + 1)}
          onToday={() => setMonthOffset(0)}
        />
        <CalendarLegend
          minNights={property.minNights || 3}
          hasOverrides={data.openOverrides.size > 0 || data.closedOverrides.size > 0}
        />
        <CalendarGrid
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth()}
          today={today}
          minNights={property.minNights || 3}
          checkInTime={property.checkInTime || "14:00"}
          checkOutTime={property.checkOutTime || "12:00"}
          bars={data.bars}
          bufferDates={data.bufferDates}
          potentialDates={data.potentialDates}
          unbookableDates={data.unbookableDates}
          sameDayCleaningDates={data.sameDayCleaningDates}
          conflictDates={data.conflictDates}
          openOverrides={data.openOverrides}
          closedOverrides={data.closedOverrides}
          cleaningOverrides={data.cleaningOverrides}
          loading={loadingEvents}
          onSelectReservation={onSelectReservation}
          onClaimBar={(seg, rect) => {
            if (!seg.eventUid) return;
            setClaimBar({
              eventUid: seg.eventUid,
              startDate: seg.startDate,
              endDate: seg.endDate,
              platform: seg.platform,
              defaultName: seg.name,
            });
            setClaimAnchor(rect);
          }}
          onCellClick={(dateStr, rect) => {
            setPopoverDate(dateStr);
            setPopoverAnchor(rect);
          }}
        />
      </div>
      <AgendaList bars={data.bars} today={today} onSelectReservation={onSelectReservation} />
      {popoverDate && popoverAnchor && (
        <CalendarDatePopover
          date={popoverDate}
          anchorRect={popoverAnchor}
          bars={data.bars}
          bufferDates={data.bufferDates}
          potentialDates={data.potentialDates}
          sameDayCleaningDates={data.sameDayCleaningDates}
          unbookableDates={data.unbookableDates}
          openOverrides={data.openOverrides}
          closedOverrides={data.closedOverrides}
          cleaningOverrides={data.cleaningOverrides}
          syncedEvents={syncedEvents}
          reservations={property.reservations}
          onClose={closePopover}
          onSetOverride={(type) => setOverride(popoverDate, type)}
          onRemoveOverride={() => deleteOverride(popoverDate)}
          onExtendBooking={(b) => extendBooking(popoverDate, b)}
        />
      )}
      {claimBar && claimAnchor && (
        <BarClaimPopover
          bar={claimBar}
          anchorRect={claimAnchor}
          onClose={closeClaim}
          onSave={claimSyncedBooking}
        />
      )}
    </div>
  );
}
