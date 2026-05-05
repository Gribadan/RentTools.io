"use client";

import { useEffect, useMemo, useState } from "react";
import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarDatePopover } from "@/components/calendar/calendar-date-popover";
import { BarClaimPopover, type ClaimableBar } from "@/components/calendar/bar-claim-popover";
import { ConflictBanner } from "@/components/calendar/conflict-banner";
import { useCalendarFetch } from "@/components/calendar/use-calendar-fetch";
import { useCalendarData } from "@/components/calendar/use-calendar-data";
import { buildCalendarExportText } from "@/components/calendar/calendar-export";
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

// Side panel width (px). When the panel is open we add right padding
// to the calendar wrapper of the same value so the calendar reflows
// rather than being covered by the panel.
const PANEL_WIDTH_PX = 400;

export function PropertyCalendar({
  property,
  onSelectReservation,
  // onAddReservation kept for prop-shape compat with the dashboard,
  // but we now POST /api/reservations directly when the side panel
  // submits since we need the result to refresh local state.
  onAddReservation: _onAddReservation,
}: PropertyCalendarProps) {
  const { locale, t } = useI18n();
  // Multi-date selection — the side panel opens whenever this Set is
  // non-empty. Each click on a calendar cell toggles membership.
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
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

  // Build the list of months to render — starting from today's month
  // and stepping forward N times.
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

  // Escape always clears the selection (and therefore closes the panel).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedDates.size > 0) {
        clearSelection();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedDates.size]);

  // Bulk override write — applies the same override type to every
  // currently-selected date, then clears the selection.
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
    // checkIn = first selected day. checkOut = last selected day + 1
    // (a 3-night stay across May 1, 2, 3 has check-out on May 4).
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

  // Single-date helpers (used by the panel when only one date is
  // selected — the existing per-date actions still apply).
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
    clearSelection();
    window.location.reload();
  };

  // Bar claim popover (separate from the date selection panel — it
  // opens when the user clicks an UNCLAIMED iCal-synced bar and asks
  // to name it).
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

  const handleExport = () => {
    const text = buildCalendarExportText({
      property,
      monthLabel: months[0].toLocaleDateString(locale === "ru" ? "ru-RU" : "en", { month: "long", year: "numeric" }),
      today,
      syncedEvents,
      links,
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

  const panelOpen = selectedDates.size > 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Calendar content reflows narrower on lg+ when the side panel
          is open, so the calendar isn't covered by the panel. The
          panel itself stays fixed to the viewport's right edge. */}
      <div
        className="space-y-6 transition-[padding] duration-200 ease-out"
        style={{ paddingRight: panelOpen ? `${PANEL_WIDTH_PX}px` : undefined }}
      >
        <CalendarToolbar
          property={property}
          links={links}
          syncing={syncing}
          exportCopied={exportCopied}
          onSyncNow={handleSyncNow}
          onExport={handleExport}
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

        {/* Legend rendered once at the top (was inside the wrapper
            per-month before; now it shares context with the entire
            scrollable stack). */}
        <div className="cls-isolate hidden sm:block rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
          <CalendarLegend
            minNights={property.minNights || 3}
            hasOverrides={data.openOverrides.size > 0 || data.closedOverrides.size > 0}
          />
        </div>

        {/* Vertical month stack — replaces the prev/next/today nav. */}
        <div className="hidden sm:block space-y-8">
          {months.map((m, i) => (
            <section key={`${m.getFullYear()}-${m.getMonth()}`}>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--ink)]">
                {m.toLocaleDateString(locale === "ru" ? "ru-RU" : "en", {
                  month: "long",
                  year: i === 0 || m.getMonth() === 0 ? "numeric" : undefined,
                })}
              </h2>
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
          ))}
        </div>
      </div>

      {/* Selection-driven side panel. Opens whenever 1+ dates are
          selected; closes via panel × button or Escape. */}
      {panelOpen && (
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
