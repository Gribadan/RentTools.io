"use client";

import { useMemo } from "react";
import type { CalendarOverviewProperty } from "@/lib/calendar-overview";
import type { CalendarLink, DateOverride, Property } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { CalendarEvent } from "./types";
import { useCalendarData } from "./use-calendar-data";
import { addDaysStr } from "./utils";
import {
  layoutOverviewBar,
  overviewDayCount,
  OVERVIEW_BAR_HEIGHT,
  OVERVIEW_DAY_WIDTH,
  OVERVIEW_LANE_HEIGHT,
  OVERVIEW_PROPERTY_COLUMN_CLASS,
  OVERVIEW_ROW_PADDING,
} from "./overview-layout";
import { OVERVIEW_COPY } from "./overview-copy";

const COPY: Record<Locale, { calendar: string; openCalendar: string; openReservation: string; closed: string; overlap: string; unverified: string }> = {
  en: { calendar: "Calendar →", openCalendar: "Open property calendar", openReservation: "Open reservation", closed: "Closed", overlap: "Overlapping stays", unverified: "Sync failed. Availability unverified." },
  ru: { calendar: "Календарь →", openCalendar: "Открыть календарь объекта", openReservation: "Открыть бронь", closed: "Закрыто", overlap: "Пересечение броней", unverified: "Ошибка синхронизации. Даты не проверены." },
  de: { calendar: "Kalender →", openCalendar: "Objektkalender öffnen", openReservation: "Buchung öffnen", closed: "Gesperrt", overlap: "Überlappende Aufenthalte", unverified: "Synchronisierung fehlgeschlagen. Verfügbarkeit ungeprüft." },
  fr: { calendar: "Calendrier →", openCalendar: "Ouvrir le calendrier du logement", openReservation: "Ouvrir la réservation", closed: "Fermé", overlap: "Séjours superposés", unverified: "Échec de synchronisation. Disponibilité non vérifiée." },
  es: { calendar: "Calendario →", openCalendar: "Abrir el calendario del alojamiento", openReservation: "Abrir reserva", closed: "Cerrado", overlap: "Estancias superpuestas", unverified: "Falló la sincronización. Disponibilidad sin verificar." },
};

function platformColor(platform: string): string {
  if (platform === "airbnb") return "#cf2344";
  if (platform === "booking") return "#003580";
  if (platform === "vrbo") return "#2c5da9";
  if (platform === "direct") return "#166c65";
  return "#475569";
}

export interface CalendarOverviewRowProps {
  property: CalendarOverviewProperty;
  monthStart: string;
  monthEnd: string;
  today?: string;
  onOpenReservation: (propertyId: number, reservationId: number) => void;
  onOpenProperty: (propertyId: number) => void;
}

export function CalendarOverviewRow({
  property,
  monthStart,
  monthEnd,
  today,
  onOpenReservation,
  onOpenProperty,
}: CalendarOverviewRowProps) {
  const { locale, t } = useI18n();
  const c = COPY[locale];
  const overviewCopy = OVERVIEW_COPY[locale];
  const inputs = useMemo(() => {
    const calendarProperty: Property = {
      id: property.id,
      userId: 0,
      name: property.name,
      minNights: property.minNights,
      checkInTime: property.checkInTime,
      checkOutTime: property.checkOutTime,
      bookingWindow: property.bookingWindow,
      cleaningEnabled: property.cleaningEnabled,
      feedToken: null,
      createdAt: "",
      reservations: property.reservations.map((reservation, index) => ({
        ...reservation,
        id: reservation.id ?? -(index + 1),
        propertyId: property.id,
        createdAt: "",
      })),
    };
    const events: CalendarEvent[] = property.events.map((event, index) => ({ ...event, id: index + 1 }));
    const links: CalendarLink[] = property.links.map((link, index) => ({
      ...link,
      id: index + 1,
      propertyId: property.id,
      icalExportUrl: "",
      lastFetchedAt: null,
      lastError: null,
      failureCount: 0,
      createdAt: "",
    }));
    const overrides: DateOverride[] = property.overrides.map((override, index) => ({
      ...override,
      id: index + 1,
      propertyId: property.id,
      note: "",
      createdAt: "",
    }));
    return { calendarProperty, events, links, overrides };
  }, [property]);
  const { bars, closedOverrides, cleaningOverrides, bufferDates, unbookableDates, potentialDates, sameDayCleaningDates, openOverrides } = useCalendarData(inputs.calendarProperty, inputs.events, inputs.links, inputs.overrides);
  const visibleBars = bars.flatMap((bar) => {
    const layout = layoutOverviewBar(bar, monthStart, monthEnd, property);
    return layout ? [{ bar, layout }] : [];
  });
  const numberOfDays = overviewDayCount(monthStart, monthEnd);
  const numberOfLanes = Math.max(1, ...visibleBars.map(({ layout }) => layout.rowIdx + 1));
  const days = Array.from({ length: numberOfDays }, (_, index) => {
    const date = addDaysStr(monthStart, index);
    const occupied = visibleBars.some(({ bar }) => date >= bar.startDate && date < bar.endDate);
    const closed = closedOverrides.has(date) && !occupied;
    const cleaning = cleaningOverrides.has(date);
    const open = openOverrides.has(date) && !occupied;
    const buffer = bufferDates.has(date) && !occupied;
    const unbookable = unbookableDates.has(date) && !occupied;
    const potential = potentialDates.has(date);
    const sameDayCleaning = sameDayCleaningDates.has(date);
    const status = closed ? "closed" : cleaning ? "cleaning" : open ? "open" : buffer ? "buffer" : unbookable ? "unbookable" : potential ? "potential" : sameDayCleaning ? "turnover" : "unmodified";
    const label = closed ? c.closed : cleaning ? t("calendar.manualCleaning") : open ? t("calendar.open") : buffer ? overviewCopy.buffer : unbookable ? overviewCopy.unbookable : potential ? t("calendar.cleaningQ") : sameDayCleaning ? t("calendar.cleaning") : null;
    return { date, status, label, blocked: closed || cleaning || buffer || unbookable };
  });
  const blockedDates = days.filter(day => day.blocked);
  const hasLabels = days.some(day => day.label);
  const minHeight = OVERVIEW_ROW_PADDING * 2 + numberOfLanes * OVERVIEW_LANE_HEIGHT + (property.syncFailed ? 24 : 0) + (hasLabels ? 28 : 0);
  const reservationIds = new Set(property.reservations.flatMap((reservation) => reservation.id ? [reservation.id] : []));

  return (
    <div role="row" data-property-id={property.id} data-calendar-status={property.syncFailed ? "unverified" : "ready"} data-visible-booking-count={visibleBars.length} data-blocked-date-count={blockedDates.length} data-calendar-occupied={property.syncFailed || visibleBars.length > 0 || days.some(day => day.label && day.status !== "open")} className="flex min-w-full w-max border-b border-[var(--line)]">
      <div role="rowheader" className={`${OVERVIEW_PROPERTY_COLUMN_CLASS} sticky left-0 z-20 flex shrink-0 items-center border-r border-[var(--line)] bg-[var(--bg-2)] px-3 py-3`}>
        <button
          type="button"
          onClick={() => onOpenProperty(property.id)}
          aria-label={`${c.openCalendar}: ${property.name}`}
          title={property.name}
          className="min-h-11 w-full rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          <span className="line-clamp-3 break-words text-sm font-medium leading-5 text-[var(--ink)] sm:line-clamp-2">{property.name}</span>
          <span className="mt-1 block text-xs text-sky-600 dark:text-sky-400">{c.calendar}</span>
          {property.syncFailed && <span className="mt-2 block text-xs font-normal text-amber-700 dark:text-amber-300">⚠ {c.unverified}</span>}
        </button>
      </div>
      <div
        role="cell"
        aria-colspan={numberOfDays}
        aria-label={`${property.name}: ${monthStart} – ${monthEnd}${property.syncFailed ? ` · ${c.unverified}` : ""}`}
        className="relative self-stretch"
        style={{ width: numberOfDays * OVERVIEW_DAY_WIDTH, minHeight }}
      >
        <div aria-hidden="true" className="absolute inset-0 flex">
          {days.map(({ date, status, label }) => {
            const background = property.syncFailed ? "bg-amber-500/10" : status === "closed" ? "bg-rose-500/10" : status === "cleaning" || status === "buffer" ? "bg-[var(--cleaning-cell-bg)]" : status === "open" ? "bg-emerald-500/8" : status === "unbookable" ? "bg-[var(--ink-4)]/10" : date === today ? "bg-sky-500/8" : "";
            return (
              <div
                key={date}
                data-date={date}
                data-date-status={property.syncFailed ? "unverified" : status}
                title={label ? `${date}: ${label}` : date}
                className={`relative h-full shrink-0 border-r border-[var(--line)] ${background}`}
                style={{ width: OVERVIEW_DAY_WIDTH }}
              >
                {label && <span className={`absolute inset-x-0 line-clamp-2 break-words px-0.5 text-center text-[9px] leading-3 ${status === "closed" ? "text-rose-600 dark:text-rose-300" : status === "open" ? "text-emerald-600 dark:text-emerald-300" : status === "unbookable" || status === "potential" ? "text-[var(--ink-3)]" : "text-[var(--cleaning-fg)]"}`} style={{ bottom: property.syncFailed ? 28 : 4 }}>{label}</span>}
              </div>
            );
          })}
        </div>
        {days.filter(day => day.label).map(({ date, label }) => <span key={date} className="sr-only">{date}: {label}. </span>)}
        {property.syncFailed && <span className="absolute bottom-1 left-2 text-xs text-amber-700 dark:text-amber-300">⚠ {c.unverified}</span>}
        {visibleBars.map(({ bar, layout }, index) => {
          const overlaps = bar.conflictDates?.some(date => date >= monthStart && date < monthEnd) ?? false;
          const label = bar.isAvailabilityBlock ? `${bar.name} · ${t("calendar.availabilityBlock")}` : bar.name;
          const canOpenReservation = property.canManage && !!bar.reservationId && reservationIds.has(bar.reservationId);
          const action = canOpenReservation ? c.openReservation : c.openCalendar;
          const description = `${label} · ${property.name} · ${bar.startDate} – ${bar.endDate}${overlaps ? ` · ${c.overlap}` : ""} · ${action}`;
          return (
            <button
              type="button"
              key={`${bar.reservationId ?? "event"}-${bar.platform}-${bar.eventUid ?? index}-${bar.startDate}`}
              data-reservation-id={canOpenReservation ? bar.reservationId : undefined}
              data-start-date={bar.startDate}
              data-end-date={bar.endDate}
              data-lane={layout.rowIdx}
              aria-label={description}
              title={description}
              onClick={() => canOpenReservation ? onOpenReservation(property.id, bar.reservationId!) : onOpenProperty(property.id)}
              className={`absolute flex scroll-ml-36 items-center border px-2 text-left text-xs font-medium text-white hover:brightness-110 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:scroll-ml-56 ${layout.continuesBefore || bar.linkedBefore ? "rounded-l-none" : "rounded-l-md"} ${layout.continuesAfter || bar.linkedAfter ? "rounded-r-none" : "rounded-r-md"} ${overlaps ? "border-amber-300" : "border-white/20"}`}
              style={{
                left: layout.left,
                width: layout.width,
                top: OVERVIEW_ROW_PADDING + layout.rowIdx * OVERVIEW_LANE_HEIGHT,
                height: OVERVIEW_BAR_HEIGHT,
                backgroundColor: bar.isAvailabilityBlock ? "#64748b" : platformColor(bar.platform),
                backgroundImage: bar.isExtension || bar.isAvailabilityBlock ? "repeating-linear-gradient(135deg,transparent,transparent 5px,rgba(255,255,255,.16) 5px,rgba(255,255,255,.16) 7px)" : undefined,
              }}
            >
              <span data-overview-bar-label className="sticky left-[136px] flex min-w-0 max-w-[min(100%,calc(100vw_-_168px))] shrink-0 items-center gap-1 overflow-hidden sm:left-[216px] sm:max-w-[min(100%,calc(100vw_-_288px))]">
                {layout.continuesBefore && <span aria-hidden="true" className="shrink-0">‹</span>}
                <span className="min-w-0 truncate">{label}</span>
                {overlaps && <span aria-hidden="true" className="shrink-0">!</span>}
                <span aria-hidden="true" className="shrink-0">{layout.continuesAfter ? "›" : "↗"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
