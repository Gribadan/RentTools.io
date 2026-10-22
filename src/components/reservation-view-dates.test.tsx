import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReservationView } from "./reservation-view";
import type { Reservation } from "@/lib/types";

const base: Reservation = {
  id: 1,
  propertyId: 1,
  name: "Synthetic guest",
  platform: "direct",
  checkIn: "2027-01-06T00:00:00.000Z",
  checkOut: "2027-01-09T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderReservation(reservation = base): string {
  const props: ComponentProps<typeof ReservationView> = {
    reservation,
    guests: [],
    propertyName: "Synthetic apartment",
    onGuestsUpdated: () => {},
    onDeleteGuest: () => {},
    onDeleteReservation: () => {},
    onUpdateReservation: () => {},
    onUpdateParent: () => {},
    onUpdateGuest: async () => {},
  };
  return renderToStaticMarkup(createElement(ReservationView, props));
}

afterEach(() => vi.unstubAllEnvs());

describe("reservation card date-only display", () => {
  it.each(["Pacific/Honolulu", "UTC", "Asia/Tokyo"])("keeps header, nights and group dates stable in %s", (timezone) => {
    vi.stubEnv("TZ", timezone);
    const html = renderReservation();
    expect(html).toContain("06 Jan 2027 — 09 Jan 2027");
    expect(html).toContain("3 nights");
    expect(html).toContain("Direct 6-9 January 2027 - Synthetic - Synthetic apartment");
    expect(html).not.toContain("05 Jan 2027");
  });

  it.each(["Pacific/Honolulu", "UTC", "Asia/Tokyo"])("keeps year and month boundaries in %s", (timezone) => {
    vi.stubEnv("TZ", timezone);
    const html = renderReservation({ ...base, checkIn: "2026-12-31T00:00:00.000Z", checkOut: "2027-01-03T00:00:00.000Z" });
    expect(html).toContain("31 Dec 2026 — 03 Jan 2027");
    expect(html).toContain("Direct 31 December 2026-3 January 2027 - Synthetic - Synthetic apartment");
    expect(html).toContain("3 nights");
  });
});
