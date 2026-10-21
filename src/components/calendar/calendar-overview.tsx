"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import { calendarOverviewMonth, type CalendarOverviewProperty, type CalendarOverviewResponse } from "@/lib/calendar-overview";
import { toDateStr, addDaysStr } from "./utils";
import { toReservationDateInput } from "@/lib/reservation-dates";
import { bookingWindowCutoff } from "@/lib/types";
import { CalendarOverviewRow } from "./overview-row";
import { OVERVIEW_DAY_WIDTH, OVERVIEW_PROPERTY_COLUMN_CLASS } from "./overview-layout";
import { OverviewReservation } from "./overview-reservation";

interface CalendarOverviewProps {
  month: string | null;
  query: string;
  selectedReservationId: number | null;
  onMonthChange: (month: string) => void;
  onQueryChange: (query: string) => void;
  onOpenReservation: (propertyId: number, reservationId: number) => void;
  onOpenProperty: (propertyId: number) => void;
  onCloseReservation: () => void;
  onPropertiesLoaded: (properties: CalendarOverviewProperty[]) => void;
}

export function CalendarOverview(props: CalendarOverviewProps) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const today = toDateStr(new Date());
  const month = calendarOverviewMonth(props.month)?.month ?? today.slice(0, 7);
  const range = calendarOverviewMonth(month)!;
  const [data, setData] = useState<CalendarOverviewResponse | null>(null);
  const [errorMonth, setErrorMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const scrollToToday = useRef(false);
  const loadedCallback = useRef(props.onPropertiesLoaded);
  useEffect(() => { loadedCallback.current = props.onPropertiesLoaded; }, [props.onPropertiesLoaded]);
  const refresh = useCallback(() => setReload(value => value + 1), []);
  useLiveRefresh(refresh);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return null;
      setLoading(true);
      return fetch(`/api/calendar/overview?month=${month}`, { signal: controller.signal, cache: "no-store" });
    })
      .then(async response => {
        if (!response) return;
        if (!response.ok) throw new Error("Calendar unavailable");
        const result = await response.json() as CalendarOverviewResponse;
        if (result.month !== month || !Array.isArray(result.properties)) throw new Error("Invalid calendar response");
        if (controller.signal.aborted) return;
        setData(result);
        setErrorMonth(null);
        loadedCallback.current(result.properties);
      })
      .catch(() => { if (!controller.signal.aborted) setErrorMonth(month); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, reload]);

  useEffect(() => { if (scroller.current) scroller.current.scrollLeft = 0; }, [month]);
  useEffect(() => {
    if (scrollToToday.current && data?.month === month && scroller.current) {
      scroller.current.scrollLeft = Math.max(0, (Number(today.slice(8)) - 3) * OVERVIEW_DAY_WIDTH);
      scrollToToday.current = false;
    }
  }, [data, month, today]);

  const days = Array.from({ length: Math.round((range.end.getTime() - range.start.getTime()) / 86400000) }, (_, index) => addDaysStr(range.startDate, index));
  const currentData = data?.month === month ? data : null;
  const visible = currentData?.properties.filter(property => property.name.toLocaleLowerCase(locale).includes(props.query.trim().toLocaleLowerCase(locale))) ?? [];
  const changeMonth = (offset: number) => {
    const next = new Date(range.start);
    next.setUTCMonth(next.getUTCMonth() + offset);
    const value = next.toISOString().slice(0, 7);
    if (calendarOverviewMonth(value)) props.onMonthChange(value);
  };
  const goToday = () => {
    scrollToToday.current = month !== today.slice(0, 7);
    props.onMonthChange(today.slice(0, 7));
    if (month === today.slice(0, 7) && scroller.current) {
      scroller.current.scrollLeft = Math.max(0, (Number(today.slice(8)) - 3) * OVERVIEW_DAY_WIDTH);
    }
  };
  const selectedProperty = currentData?.properties.find(property => property.reservations.some(reservation => reservation.id === props.selectedReservationId));
  const hasOccupancy = visible.some(property => property.syncFailed ||
    property.reservations.some(reservation => toReservationDateInput(reservation.checkIn) < range.endDate && toReservationDateInput(reservation.checkOut) > range.startDate) ||
    property.events.some(event => event.startDate < range.endDate && event.endDate > range.startDate && event.startDate < bookingWindowCutoff(property.bookingWindow || 365)) ||
    property.overrides.some(override => override.type !== "open"));
  const controlClass = "min-h-11 rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--m-accent)]";

  return (
    <section className="mx-auto max-w-[1760px]" aria-label={ru ? "Общий календарь" : "All calendars"}>
      {props.selectedReservationId && (
        <OverviewReservation key={props.selectedReservationId} reservationId={props.selectedReservationId} propertyName={selectedProperty?.name} onClose={props.onCloseReservation} onChanged={refresh} />
      )}
      <div hidden={!!props.selectedReservationId}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">{ru ? "Общий календарь" : "All calendars"}</h1>
            <p className="mt-1 text-sm text-[var(--ink-3)]">{new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(range.start)} · {ru ? "Все объекты" : "All properties"}</p>
          </div>
          <div className="grid w-full grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 sm:w-auto sm:grid-cols-[auto_auto_auto_auto]">
            <button className={controlClass} onClick={goToday}>{ru ? "Сегодня" : "Today"}</button>
            <button className={controlClass} onClick={() => changeMonth(-1)} aria-label={ru ? "Предыдущий месяц" : "Previous month"} disabled={month === "1000-01"}><ChevronLeft size={18} /></button>
            <label className="sr-only" htmlFor="overview-month">{ru ? "Месяц" : "Month"}</label>
            <input id="overview-month" type="month" min="1000-01" max="9999-11" value={month} onChange={event => { if (calendarOverviewMonth(event.target.value)) props.onMonthChange(event.target.value); }} className={`${controlClass} min-w-0 w-full sm:w-44`} />
            <button className={controlClass} onClick={() => changeMonth(1)} aria-label={ru ? "Следующий месяц" : "Next month"} disabled={month === "9999-11"}><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] px-3 sm:max-w-sm">
            <Search size={17} className="shrink-0 text-[var(--ink-3)]" aria-hidden="true" />
            <span className="sr-only">{ru ? "Поиск по названию объекта" : "Search properties"}</span>
            <input type="search" value={props.query} onChange={event => props.onQueryChange(event.target.value)} placeholder={ru ? "Поиск по названию объекта" : "Search properties"} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-accent)]" />
          </label>
          <p className="text-xs text-[var(--ink-3)]">{ru ? "Даты — ночи до выезда. Прокрутите вправо →" : "Dates show nights before checkout. Scroll right →"}</p>
        </div>
        {loading && currentData && <p role="status" className="mb-2 text-xs text-[var(--ink-3)]">{ru ? "Обновление…" : "Updating…"}</p>}
        {errorMonth === month ? (
          <div role="alert" className="rounded-xl border border-red-400/50 bg-red-400/10 p-6 text-sm text-[var(--ink)]">
            <p>{ru ? "Не удалось загрузить календарь. Занятость неизвестна." : "Calendar could not be loaded. Availability is unknown."}</p>
            <button className={`${controlClass} mt-3`} onClick={refresh} disabled={loading}>{loading ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Повторить" : "Retry")}</button>
          </div>
        ) : !currentData ? (
          <div role="status" className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-10 text-center text-[var(--ink-3)]">{ru ? "Загрузка календаря…" : "Loading calendar…"}</div>
        ) : currentData.properties.length === 0 ? (
          <EmptyState icon={<CalendarDays size={20} />} title={ru ? "Нет доступных объектов" : "No properties yet"} description={ru ? "Здесь появятся объекты, к которым у вас есть доступ." : "Properties you can access will appear here."} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<Search size={20} />} title={ru ? "Объекты не найдены" : "No matching properties"} description={ru ? "Попробуйте другое название или очистите поиск." : "Try another name or clear the search."} cta={{ label: ru ? "Сбросить поиск" : "Clear search", onClick: () => props.onQueryChange("") }} />
        ) : (
          <>
            {!hasOccupancy && (
              <p role="status" className="mb-3 rounded-lg border border-[var(--line)] p-3 text-sm text-[var(--ink-3)]">{ru ? "В этом месяце нет бронирований или блокировок." : "No bookings or blocks this month."}</p>
            )}
            <div ref={scroller} tabIndex={0} role="region" aria-label={ru ? "Календарь объектов, горизонтальная прокрутка" : "Property calendar, scroll horizontally"} className="max-h-[65vh] overflow-auto rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] focus-visible:outline-2 focus-visible:outline-[var(--m-accent)]">
              <div role="table" aria-label={ru ? "Занятость объектов" : "Property occupancy"} className="min-w-full w-max">
                <div role="row" className="sticky top-0 z-30 flex min-w-full border-b border-[var(--line-2)] bg-[var(--bg-2)]">
                  <div role="columnheader" className={`${OVERVIEW_PROPERTY_COLUMN_CLASS} sticky left-0 z-40 flex shrink-0 items-center border-r border-[var(--line-2)] bg-[var(--bg-2)] px-3 text-xs font-semibold text-[var(--ink-3)]`}>{ru ? "Объект" : "Property"} · {visible.length}</div>
                  {days.map(day => (
                    <div role="columnheader" key={day} aria-label={day} className={`flex h-16 shrink-0 flex-col items-center justify-center border-r border-[var(--line)] text-xs ${day === today ? "bg-[var(--m-accent)]/10 font-semibold text-[var(--m-accent)]" : "text-[var(--ink-3)]"}`} style={{ width: OVERVIEW_DAY_WIDTH }}>
                      <span>{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`))}</span>
                      <span className="mt-1 text-base font-semibold">{Number(day.slice(8))}</span>
                    </div>
                  ))}
                </div>
                {visible.map(property => <CalendarOverviewRow key={property.id} property={property} monthStart={range.startDate} monthEnd={range.endDate} today={today} onOpenReservation={props.onOpenReservation} onOpenProperty={props.onOpenProperty} />)}
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-3)]">{ru ? "Соседние полосы разделены границей смены гостей. Пересечения показаны отдельными полосами." : "Separate bars mark guest turnover. Overlapping stays appear on separate lines."}</p>
          </>
        )}
      </div>
    </section>
  );
}
