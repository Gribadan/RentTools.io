"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
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

  // Single static sticky header at the top of the calendar column. The
  // weekday row and sync button literally never move — only the month
  // label inside <h2> swaps as the user scrolls. activeMonthIdx tracks
  // which month section is currently visible just below the sticky.
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stickyEl = stickyHeaderRef.current;
    if (!stickyEl) return;
    const main = stickyEl.closest("main");
    if (!main) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const headerBottom = stickyEl.getBoundingClientRect().bottom;
        let idx = 0;
        for (let i = 0; i < sectionRefs.current.length; i++) {
          const el = sectionRefs.current[i];
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top <= headerBottom + 1) idx = i;
          else break;
        }
        setActiveMonthIdx(idx);
      });
    };

    main.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      main.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [months.length]);

  const data = useCalendarData(property, syncedEvents, links, overrides);

  // RT-25.10 tick 2 — fetch the priority-0 cleaner so the cleaning chips
  // can show "🧹 {name}" as a hover tooltip. The cleaning sidebar in
  // PropertyCleaningView already does this fetch on its own surface;
  // duplicating here keeps the calendar tab self-contained without
  // pushing more props through the dashboard wrapper.
  const [defaultCleanerName, setDefaultCleanerName] = useState<string | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cleaner-assignments?propertyId=${property.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        const top = arr[0];
        setDefaultCleanerName(top?.cleanerName ?? top?.username ?? undefined);
      })
      .catch(() => {
        if (!cancelled) setDefaultCleanerName(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [property.id]);

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

  // Static sticky header chrome — month label, sync button, and the
  // Mon-Sun weekday row. Hoisted above the months.map so the chrome
  // pins ONCE and never swaps; only the month label text reacts to
  // scroll. Z-index 30 so it paints above booking bars (z-10 hover-
  // bleeds).
  const WEEKDAYS = locale === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const activeMonth = months[activeMonthIdx] ?? months[0];
  const activeMonthShowYear = activeMonthIdx === 0 || activeMonth.getMonth() === 0;

  return (
    /* Two layers of layout:
         1. Outer: negative horizontal margin to ESCAPE the dashboard
            <main>'s side padding so this content area aligns 1:1
            with the dashboard header (which lives outside <main>).
            Otherwise calendar+sidebar would always be inset by
            main's px-* and never line up with the header's content
            edges.
         2. Inner: max-w-[1760px] mx-auto + px-3 sm:px-5, mirroring
            the header's structure exactly. This way both the header
            row and the calendar row use the same content rectangle
            at every viewport width.
       Sidebar slot is ALWAYS rendered on lg+ (with placeholder copy
       when no dates are selected) so the calendar's effective width
       is stable across selection state — no horizontal jank when the
       user clicks a cell. */
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
    <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
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

        {/* Vertical month stack with ONE static sticky header above
            it. The header chrome (weekday row + sync button) is fully
            frozen — only the <h2> month label updates as scroll moves
            between sections. Each section just renders its grid; the
            scroll listener above tracks which section is at the top. */}
        <div className="hidden sm:block">
          {/* Frozen header — airbnb-style. Page-bg fill + soft shadow,
              no border or panel-bg on the weekday row so the labels
              float cleanly. The shadow plus z-30 hide section content
              that scrolls behind it. */}
          <header
            ref={stickyHeaderRef}
            className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 bg-[var(--bg)] mb-3 shadow-[0_8px_18px_-10px_rgba(0,0,0,0.18),0_2px_4px_-2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between gap-3 pt-3 pb-1">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                {activeMonth.toLocaleDateString(locale === "ru" ? "ru-RU" : "en", {
                  month: "long",
                  year: activeMonthShowYear ? "numeric" : undefined,
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
            <div className="grid grid-cols-7 pb-2">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-4)]"
                >
                  {wd}
                </div>
              ))}
            </div>
          </header>

          {months.map((m, i) => {
            const showYear = i === 0 || m.getMonth() === 0;
            const monthLabel = m.toLocaleDateString(locale === "ru" ? "ru-RU" : "en", {
              month: "long",
              year: showYear ? "numeric" : undefined,
            });
            return (
            <section
              key={`${m.getFullYear()}-${m.getMonth()}`}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="mb-8"
            >
              {/* In-flow month label so each upcoming month is visible
                  at its natural position. When the section reaches the
                  frozen header, this label scrolls behind it (the header
                  is opaque + z-30) and the frozen header's <h2> already
                  shows the same name — no visual duplication.
                  Skipped for i === 0 because that month is already the
                  active one in the frozen header at scroll=0; rendering
                  it again here is a redundant duplicate for the user. */}
              {i > 0 && (
                <h3 className="mb-3 text-xl font-semibold tracking-tight text-[var(--ink-2)]">
                  {monthLabel}
                </h3>
              )}
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
                  defaultCleanerName={defaultCleanerName}
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
          case it takes full width and the calendar hides). Borderless
          + bg-2 panel mirrors the calendar grid containers; lg:top-3
          gives ~12px breathing room from the global header (matching
          py-3 of the frozen calendar header). */}
      <aside
        className={`w-full lg:w-[400px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip] ${
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
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--m-accent)]/10 text-[var(--m-accent)]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V10.5h18v8.25" />
              </svg>
            </div>
            <p className="text-base font-semibold tracking-tight text-[var(--ink)]">
              {locale === "ru" ? "Выберите день" : "Pick a day"}
            </p>
            <p className="text-sm text-[var(--ink-3)] leading-relaxed max-w-[260px]">
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
    </div>
  );
}
