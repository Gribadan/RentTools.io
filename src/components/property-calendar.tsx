"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { PropertySwitcher } from "@/components/property-switcher";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  weekdays: string[];
  connectCalendar: string;
  dateLocale: string;
  syncNow: string;
  pickADay: string;
  pickADayHint: string;
  today: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    connectCalendar: "Connect a calendar",
    dateLocale: "en",
    syncNow: "Sync now",
    pickADay: "Pick a day",
    pickADayHint: "Click any date in the calendar to open its actions or create a reservation.",
    today: "Today",
  },
  ru: {
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    connectCalendar: "Подключить календарь",
    dateLocale: "ru-RU",
    syncNow: "Синхронизировать сейчас",
    pickADay: "Выберите день",
    pickADayHint: "Кликните по любой дате в календаре, чтобы открыть действия и создать бронь.",
    today: "Сегодня",
  },
  de: {
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    connectCalendar: "Kalender verbinden",
    dateLocale: "de-DE",
    syncNow: "Jetzt synchronisieren",
    pickADay: "Tag auswählen",
    pickADayHint: "Klicken Sie auf ein Datum im Kalender, um Aktionen zu öffnen oder eine Buchung anzulegen.",
    today: "Heute",
  },
  fr: {
    weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    connectCalendar: "Connecter un calendrier",
    dateLocale: "fr-FR",
    syncNow: "Synchroniser maintenant",
    pickADay: "Choisissez un jour",
    pickADayHint: "Cliquez sur une date du calendrier pour ouvrir les actions ou créer une réservation.",
    today: "Aujourd’hui",
  },
  es: {
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    connectCalendar: "Conectar un calendario",
    dateLocale: "es-ES",
    syncNow: "Sincronizar ahora",
    pickADay: "Elija un día",
    pickADayHint: "Haga clic en cualquier fecha del calendario para abrir sus acciones o crear una reserva.",
    today: "Hoy",
  },
};

interface PropertyCalendarProps {
  property: Property;
  /** All properties the user can access — fed to PropertySwitcher
   *  inside the "Pick a day" empty state of the right aside, so the
   *  user has a fallback property switcher when the top-bar dropdown
   *  is out of view. */
  properties: Property[];
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
//
// Past months matter for: looking up a returning guest's stay, auditing
// a cleaner's previous schedule, copy-pasting an old reservation,
// reviewing how a buffer rule played out historically. Six months back
// covers most "recent past" lookups; deeper history lives in the
// reservation list / reports views, not the calendar.
//
// Future months: 12 covers the typical Airbnb 12-month booking window.
const PAST_MONTHS = 6;
const FUTURE_MONTHS = 12;
const VISIBLE_MONTHS = PAST_MONTHS + FUTURE_MONTHS;

export function PropertyCalendar({
  property,
  properties,
  onSelectReservation,
  // onAddReservation kept for prop-shape compat — the side panel
  // POSTs /api/reservations directly.
  onAddReservation: _onAddReservation,
}: PropertyCalendarProps) {
  const { locale, t } = useI18n();
  const c = COPY[locale];
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
    // Build a contiguous month list spanning [today - PAST_MONTHS,
    // today + FUTURE_MONTHS). Index `PAST_MONTHS` is today's month —
    // we scroll to it on mount so the default view stays "today first"
    // even with past months rendered above.
    return Array.from({ length: VISIBLE_MONTHS }, (_, i) =>
      new Date(today.getFullYear(), today.getMonth() - PAST_MONTHS + i, 1)
    );
  }, [today]);

  // Single static sticky header at the top of the calendar column. The
  // weekday row and sync button literally never move — only the month
  // label inside <h2> swaps as the user scrolls. activeMonthIdx tracks
  // which month section is currently visible just below the sticky.
  // Initial active month is today's, which lives at index PAST_MONTHS
  // after the past-months extension above.
  const [activeMonthIdx, setActiveMonthIdx] = useState(PAST_MONTHS);
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

  // Scroll today's month into view on demand. Used twice:
  //   1. On mount (instant) — past months render above today, so the
  //      default scroll position would be 6 months in the past. The
  //      user explicitly liked "default = current month", so we
  //      restore that view immediately.
  //   2. From the "Today" button (smooth) — quick way back when the
  //      user has scrolled away to look up old data.
  // We compute the offset manually instead of using scrollIntoView so
  // the sticky header doesn't overlap the section — the section lands
  // flush below the sticky chrome.
  const scrollToToday = useCallback((behavior: ScrollBehavior) => {
    const stickyEl = stickyHeaderRef.current;
    if (!stickyEl) return;
    const main = stickyEl.closest("main");
    if (!main) return;
    const todayMonthEl = sectionRefs.current[PAST_MONTHS];
    if (!todayMonthEl) return;
    const stickyHeight = stickyEl.getBoundingClientRect().height;
    const sectionTop = todayMonthEl.getBoundingClientRect().top;
    const mainTop = main.getBoundingClientRect().top;
    const targetScroll = main.scrollTop + (sectionTop - mainTop) - stickyHeight;
    main.scrollTo({ top: targetScroll, behavior });
  }, []);

  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (!sectionRefs.current[PAST_MONTHS]) return;
    scrollToToday("instant" as ScrollBehavior);
    didInitialScrollRef.current = true;
  }, [months.length, scrollToToday]);

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
  const WEEKDAYS = c.weekdays;

  const activeMonth = months[activeMonthIdx] ?? months[0];
  // Show the year on the active-month label whenever it differs from
  // the current year (i.e. scrolled into past months from a previous
  // year, or scrolled forward into next year). Inside the current year,
  // only January shows the year — same behaviour as the in-flow labels.
  const activeMonthShowYear =
    activeMonth.getFullYear() !== today.getFullYear() || activeMonth.getMonth() === 0;

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
            // mt-4 sm:mt-6 gives the empty state air to breathe under
            // the page header — the parent's space-y-6 alone wasn't
            // enough because the calendar header sits in a separate
            // sticky context.
            <div className="cls-isolate mt-4 animate-slide-down sm:mt-6">
              <EmptyState
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V10.5h18v8.25" />
                  </svg>
                }
                title={t("empty.calendar.title")}
                description={t("empty.calendar.desc")}
                link={{
                  label: c.connectCalendar,
                  href: `/dashboard?property=${property.id}&view=sync`,
                }}
              />
            </div>
          )}

        {/* Vertical month stack with ONE static sticky header above
            it. The header chrome (weekday row + sync button) is fully
            frozen — only the <h2> month label updates as scroll moves
            between sections. Each section just renders its grid; the
            scroll listener above tracks which section is at the top.
            Renders on mobile too — the calendar grid is responsive
            (smaller cells via the responsive classes inside
            CalendarGrid) so a 7-day-wide month fits at 320px. */}
        <div className="block">
          {/* Frozen header — airbnb-style. Page-bg fill + soft shadow,
              no border or panel-bg on the weekday row so the labels
              float cleanly. The shadow plus z-30 hide section content
              that scrolls behind it. */}
          <header
            ref={stickyHeaderRef}
            className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 bg-[var(--bg)] mb-2 sm:mb-3 shadow-[0_8px_18px_-10px_rgba(0,0,0,0.18),0_2px_4px_-2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between gap-3 pt-2 sm:pt-3 pb-1">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--ink)] truncate">
                {activeMonth.toLocaleDateString(c.dateLocale, {
                  month: "long",
                  year: activeMonthShowYear ? "numeric" : undefined,
                })}
              </h2>
              <div className="flex items-center gap-1 shrink-0">
                {/* "Today" — quick return to the current month from
                    anywhere in the past/future scroll range. Hidden
                    while the user is already viewing today's month so
                    it doesn't clutter the chrome on first load. */}
                {activeMonthIdx !== PAST_MONTHS && (
                  <button
                    onClick={() => scrollToToday("smooth")}
                    title={c.today}
                    aria-label={c.today}
                    className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2.5 py-1 text-xs font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
                  >
                    {c.today}
                  </button>
                )}
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  title={c.syncNow}
                  aria-label={c.syncNow}
                  className="rounded-full p-1.5 sm:p-2 text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-50"
                >
                  <svg className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 pb-2">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="py-1 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-4)]"
                >
                  {/* Two-letter weekdays on mobile so RU "Пн / Вт" and
                      EN "Mo / Tu" fit a ~45px column without truncating. */}
                  <span className="sm:hidden">{wd.slice(0, 2)}</span>
                  <span className="hidden sm:inline">{wd}</span>
                </div>
              ))}
            </div>
          </header>

          {months.map((m, i) => {
            // Show the year on each month's in-flow label whenever it
            // differs from the current year, plus on January as a
            // year-boundary anchor inside the current year.
            const showYear = m.getFullYear() !== today.getFullYear() || m.getMonth() === 0;
            const monthLabel = m.toLocaleDateString(c.dateLocale, {
              month: "long",
              year: showYear ? "numeric" : undefined,
            });
            return (
            <section
              key={`${m.getFullYear()}-${m.getMonth()}`}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="mb-5 sm:mb-8"
            >
              {/* In-flow month label so each month is visible at its
                  natural position. When the section reaches the frozen
                  header, this label scrolls behind it (the header is
                  opaque + z-30) and the frozen header's <h2> already
                  shows the same name — no visual duplication.
                  Skipped only for today's month (PAST_MONTHS index)
                  because the calendar lands there on initial scroll
                  and the frozen header already shows the same name —
                  rendering it again at scroll=0 is a redundant
                  duplicate. Past months and future months always get
                  their in-flow label. */}
              {i !== PAST_MONTHS && (
                <h3 className="mb-2 sm:mb-3 text-base sm:text-xl font-semibold tracking-tight text-[var(--ink-2)]">
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
          <div className="flex h-full min-h-[320px] flex-col gap-5 px-6 py-8">
            {/* Property switcher — fallback to the top-bar dropdown
                so the user can move between properties without
                leaving the calendar. Hidden when only one property
                exists (PropertySwitcher early-returns). */}
            {properties.length > 1 && (
              <PropertySwitcher
                properties={properties}
                selectedPropertyId={property.id}
                view="calendar"
                showAllOption={false}
              />
            )}
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--m-accent)]/10 text-[var(--m-accent)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V10.5h18v8.25" />
                </svg>
              </div>
              <p className="text-base font-semibold tracking-tight text-[var(--ink)]">
                {c.pickADay}
              </p>
              <p className="text-sm text-[var(--ink-3)] leading-relaxed max-w-[260px]">
                {c.pickADayHint}
              </p>
            </div>
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
