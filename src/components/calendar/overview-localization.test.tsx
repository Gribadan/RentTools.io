import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { CalendarOverview } from "./calendar-overview";
import { OverviewReservation } from "./overview-reservation";

const noop = () => {};
const props = { month: "2026-10", query: "", selectedReservationId: null, onMonthChange: noop, onQueryChange: noop, onOpenReservation: noop, onOpenProperty: noop, onCloseReservation: noop, onPropertiesLoaded: noop };

describe("overview and reservation wrapper translations", () => {
  it.each([
    ["en", "All calendars", "Search properties", "Back to all calendars", "Loading reservation…"],
    ["ru", "Общий календарь", "Поиск по названию объекта", "Вернуться в общий календарь", "Загрузка бронирования…"],
    ["de", "Alle Kalender", "Unterkünfte suchen", "Zurück zu allen Kalendern", "Buchung wird geladen…"],
    ["fr", "Tous les calendriers", "Rechercher un logement", "Retour à tous les calendriers", "Chargement de la réservation…"],
    ["es", "Todos los calendarios", "Buscar alojamientos", "Volver a todos los calendarios", "Cargando reserva…"],
  ] as const)("renders overview controls and card loading in %s", (locale: Locale, heading, search, back, loading) => {
    const markup = renderToStaticMarkup(<I18nProvider initialLocale={locale}><CalendarOverview {...props} /></I18nProvider>);
    const card = renderToStaticMarkup(<I18nProvider initialLocale={locale}><OverviewReservation reservationId={1} onClose={noop} onChanged={noop} /></I18nProvider>);
    expect(markup).toContain(heading);
    expect(markup).toContain(search);
    expect(card).toContain(back);
    expect(card).toContain(loading);
    if (locale !== "en") {
      expect(markup).not.toContain("All calendars");
      expect(markup).not.toContain("Loading calendar");
      expect(card).not.toContain("Back to all calendars");
    }
  });
});
