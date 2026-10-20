import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Reservation } from "@/lib/types";
import { ClaimSourceNotice } from "./claim-source-notice";
import type { CalendarEvent } from "./types";

const claim: Reservation = {
  id: 1,
  propertyId: 1,
  name: "Example stay",
  platform: "booking",
  checkIn: "2028-04-10T00:00:00.000Z",
  checkOut: "2028-04-14T00:00:00.000Z",
  linkedEventUid: "source-a",
  linkedEventPlatform: "booking",
  linkedEventRole: "claim",
  createdAt: "2028-01-01T00:00:00.000Z",
};

const source: CalendarEvent = {
  id: 1,
  platform: "booking",
  uid: "source-a",
  summary: "Reserved",
  startDate: "2028-04-10",
  endDate: "2028-04-16",
};

function renderNotice(
  reservations: Reservation[] = [claim],
  events: CalendarEvent[] = [source],
  loading = false,
  locale: Locale = "en",
) {
  return renderToStaticMarkup(
    <I18nProvider initialLocale={locale}>
      <ClaimSourceNotice reservations={reservations} events={events} loading={loading} />
    </I18nProvider>,
  );
}

describe("claim and source calendar notice", () => {
  it("shows both date ranges and why occupancy remains blocked, without change actions", () => {
    const markup = renderNotice();
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Reservation dates differ from the source calendar");
    expect(markup).toContain("Both date ranges stay blocked in the calendar");
    expect(markup).toContain("Example stay");
    expect(markup).toContain("Source calendar (Booking.com)");
    expect(markup).toContain('dateTime="2028-04-14"');
    expect(markup).toContain('dateTime="2028-04-16"');
    expect(markup).not.toContain("no longer overlaps");
    expect(markup).not.toContain("source-a");
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("<form");
  });

  it("adds a review warning for an exact source whose dates no longer overlap", () => {
    const markup = renderNotice([{ ...claim, checkIn: "2028-04-16", checkOut: "2028-04-18" }]);
    expect(markup).toContain("The linked source no longer overlaps this reservation");
  });

  it("renders only mismatched explicit claims", () => {
    const markup = renderNotice([
      claim,
      { ...claim, id: 2, name: "Matching stay", checkOut: "2028-04-16" },
      { ...claim, id: 3, name: "Direct extension", linkedEventRole: "extension" },
      { ...claim, id: 4, name: "Unlinked stay", linkedEventUid: null },
    ]);
    expect(markup).toContain("Example stay");
    expect(markup).not.toContain("Matching stay");
    expect(markup).not.toContain("Direct extension");
    expect(markup).not.toContain("Unlinked stay");
  });

  it("stays hidden for loading, missing sources, and matching or unlinked reservations", () => {
    expect(renderNotice([claim], [source], true)).toBe("");
    expect(renderNotice([claim], [])).toBe("");
    expect(renderNotice([{ ...claim, checkOut: "2028-04-16" }])).toBe("");
    expect(renderNotice([{ ...claim, linkedEventRole: null }])).toBe("");
  });

  it.each<Locale>(["en", "ru", "de", "fr", "es"])("provides a readable %s notice", (locale) => {
    const markup = renderNotice([claim], [source], false, locale);
    expect(markup).toContain("Example stay");
    expect(markup).toContain("Booking.com");
    expect(markup).not.toContain("undefined");
    if (locale === "ru") {
      expect(markup).toContain("Даты бронирования отличаются от исходного календаря");
      expect(markup).toContain("Оба диапазона остаются занятыми");
    }
  });
});
