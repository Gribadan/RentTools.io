"use client";

import { useEffect, useMemo, useState } from "react";
import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarDatePopover } from "@/components/calendar/calendar-date-popover";
import { BarClaimPopover, type ClaimableBar } from "@/components/calendar/bar-claim-popover";
import { ConflictBanner } from "@/components/calendar/conflict-banner";
import { useCalendarFetch } from "@/components/calendar/use-calendar-fetch";
import { useCalendarData } from "@/components/calendar/use-calendar-data";
import { addDaysStr } from "@/components/calendar/utils";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/lib/i18n/context";

interface PropertyCalendarProps {
  property: Property;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
}

// How many months to render in the vertical stack. The user scrolls
// through them airbnb-style instead of paging via prev/next arrows.
const VISIBLE_MONTHS = 12;

export function PropertyCalendar({
  property,
  onSelectReservation,
  // onAddReservation kept for prop-shape compat — the side panel
  // POSTs /api/reservations directly.
  onAddReservation: _onAddReservation,
}: PropertyCalendarProps) {
  const { locale, t } = useI18n();
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [claimBar, setClaimBar] = useState<ClaimableBar | null>(null);
  const [claimAnchor, setClaimAnchor] = useState<DOMRect | null>(null);

  const { syncedEvents, links, overrides, loadingEvents, syncing, refetchOverrides, handleSyncNow } =
    useCalendarFetch(property.id);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: VISIBLE_MONTHS }, (_, i) =>
      new Date(today.getFullYear(), today.getMonth() + i, 1)
    );
  }, [today]);

  const data = useCalendarData(property, syncedEvents, links, overrides);

  // Selection helpers ----------------------------------------------
  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };
  const clearSelection = () => setSelectedDates(new Set());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDates.size > 0) {
        clearSelection();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedDates.size]);

  // Override + reservation handlers (same as before) -----------------
  const setBulkOverride = async (type: "open" | "closed" | "cleaning") => {
    const dates = Array.from(selectedDates);
    await Promise.all(
      dates.map((dateStr) =>
        fetch(`/api/date-overrides`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: property.id, date: dateStr, type }),
        })
      )
    );
    await refetchOverrides();
    clearSelection();
  };

  const removeBulkOverride = async () => {
    const dates = Array.from(selectedDates);
    await Promise.all(
      dates.map((dateStr) =>
        fetch(`/api/date-overrides?propertyId=${property.id}&date=${dateStr}`, {
          method: "DELETE",
        })
      )
    );
    await refetchOverrides();
    clearSelection();
  };

  const createReservationFromSelection = async (data: { name: string; platform: string }) => {
    const sortedDates = Array.from(selectedDates).sort();
    if (sortedDates.length === 0) return;
    const checkIn = sortedDates[0];
    const lastDay = sortedDates[sortedDates.length - 1];
    const checkOut = addDaysStr(lastDay, 1);
    await fetch(`/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        checkIn,
        checkOut,
        platform: data.platform,
        propertyId: property.id,
      }),
    });
    clearSelection();
    window.location.reload();
  };

  const setSingleOverride = async (dateStr: string, type: "open" | "closed" | "cleaning") => {
    await fetch(`/api/date-overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, date: dateStr, type }),
    });
    await refetchOverrides();
    clearSelection();
  };

  const removeSingleOverride = async (dateStr: string) => {
    await fetch(`/api/date-overrides?propertyId=${property.id}&date=${dateStr}`, { method: "DELETE" });
    await refetchOverrides();
    clearSelection();
  };

  const extendBooking = async (rangeStart: string, rangeEnd: string, booking: ExtendableBooking) => {
    // For a contiguous selection covering N nights, the extension
    // reservation runs from the first selected date to the last + 1
    // day. linkedEventUid still points at the original booking so
    // the calendar pairs them as one continuous stay.
    await fetch(`/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: booking.name,
        checkIn: rangeStart,
        checkOut: addDaysStr(rangeEnd, 1),
        platform: booking.platform,
        propertyId: property.id,
        linkedEventUid: booking.eventUid,
      }),
    });
    clearSelection();
    window.location.reload();
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

  const panelOpen = selectedDates.size > 0;

  // Per-month stack header. Used inside each section as `sticky top-0`
  // so the visible header swaps as the user scrolls between months.
  // Combines the month label (left), the weekday row (centered) and
  // the sync icon (right) so day-of-week labels stay in view while
  // the calendar grid scrolls. Z-index 30 so it paints above booking
  // bars (which use z-10 on hover-bleeds).
  const WEEKDAYS = locale === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    /* Wrapper centers calendar + sidebar TOGETHER inside the same
       max-w-[1760px] container that the dashboard header uses. The
       sidebar slot is ALWAYS rendered on lg+ (with placeholder copy
       when no dates are selected) so the calendar's effective width
       is stable across selection state — no horizontal jank when the
       user clicks a cell. */
    <div className="mx-auto max-w-[1760px] flex flex-col lg:flex-row gap-6">
      <div className={`min-w-0 space-y-6 lg:flex-1 ${panelOpen ? "hidden lg:block" : ""}`}>
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

        {/* Legend rendered once at the top of the stack. */}
        <div className="cls-isolate hidden sm:block rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
          <CalendarLegend
            minNights={property.minNights || 3}
            hasOverrides={data.openOverrides.size > 0 || data.closedOverrides.size > 0}
          />
        </div>

        {/* Vertical month stack with sticky per-month headers. The
            sticky header now spans two rows: the month label + sync
            icon on top, the weekday Mon-Sun row right under it. When
            the user scrolls into the next month, the entire two-row
            header swaps so the day labels stay correctly anchored. */}
        <div className="hidden sm:block">
          {months.map((m, i) => {
            const showYear = i === 0 || m.getMonth() === 0;
            return (
              <section key={`${m.getFullYear()}-${m.getMonth()}`} className="mb-8">
                <header className="sticky top-0 z-30 bg-[var(--bg)] mb-2 shadow-[0_4px_8px_-6px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between gap-3 py-3">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                      {m.toLocaleDateString(locale === "ru" ? "ru-RU" : "en", {
                        month: "long",
                        year: showYear ? "numeric" : undefined,
                      })}
                    </h2>
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      title={locale === "ru" ? "Синхронизировать сейчас" : "Sync now"}
                      aria-label={locale === "ru" ? "Синхронизировать сейчас" : "Sync now"}
                      className="rounded-full p-2 text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                    >
                      <svg className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 border-y border-[var(--line)] bg-[var(--bg-2)]">
                    {WEEKDAYS.map((wd) => (
                      <div
                        key={wd}
                        className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]"
                      >
                        {wd}
                      </div>
                    ))}
                  </div>
                </header>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] [overflow:clip] [overflow-clip-margin:12px]">
                  <CalendarGrid
                    year={m.getFullYear()}
                    month={m.getMonth()}
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
                    selectedDates={selectedDates}
                    loading={loadingEvents && i === 0}
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
                    onCellClick={(dateStr) => toggleDate(dateStr)}
                  />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Side panel slot. ALWAYS rendered on lg+ so the calendar
          width is stable; shows a placeholder hint when no dates are
          selected, the date-actions panel when one or more are. On
          mobile the slot collapses unless the panel is open (in which
          case it takes full width and the calendar hides). */}
      <aside
        className={`w-full lg:w-[400px] lg:shrink-0 lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-72px)] rounded-lg border border-[var(--line-2)] bg-[var(--bg)] [overflow:clip] ${
          panelOpen ? "" : "hidden lg:block"
        }`}
      >
        {panelOpen ? (
          <CalendarDatePopover
            selectedDates={selectedDates}
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
            onClose={clearSelection}
            onToggleDate={toggleDate}
            onSetSingleOverride={setSingleOverride}
            onRemoveSingleOverride={removeSingleOverride}
            onSetBulkOverride={setBulkOverride}
            onRemoveBulkOverride={removeBulkOverride}
            onExtendBooking={extendBooking}
            onCreateReservation={createReservationFromSelection}
          />
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--m-accent)]/10 text-[var(--m-accent)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--ink-2)]">
              {locale === "ru" ? "Выберите день" : "Pick a day"}
            </p>
            <p className="text-xs text-[var(--ink-4)] leading-snug max-w-[220px]">
              {locale === "ru"
                ? "Кликните по любой дате в календаре, чтобы открыть действия и создать бронь."
                : "Click any date in the calendar to open its actions or create a reservation."}
            </p>
          </div>
        )}
      </aside>

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
