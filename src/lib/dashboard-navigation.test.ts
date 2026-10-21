import { describe, expect, it } from "vitest";
import { dashboardHref } from "./dashboard-navigation";

const overview = {
  propertyId: null,
  reservationId: null,
  overviewMonth: "2026-12",
  overviewSearch: "Studio & loft",
};

function query(href: string) {
  return Object.fromEntries(new URL(href, "https://example.invalid").searchParams);
}

describe("overview navigation", () => {
  it("opens a card with the selected month and exact property filter intact", () => {
    expect(query(dashboardHref(overview, { property: 7, reservation: 19, view: "overview" }))).toEqual({
      property: "7", reservation: "19", view: "overview", overviewMonth: "2026-12", overviewSearch: "Studio & loft",
    });
  });

  it("returns from a card to all rows without retaining a stale reservation", () => {
    const current = { ...overview, propertyId: 7, reservationId: 19 };
    expect(query(dashboardHref(current, { property: null, reservation: null, view: "overview" }))).toEqual({
      view: "overview", overviewMonth: "2026-12", overviewSearch: "Studio & loft",
    });
  });

  it("carries the overview context through an individual calendar and back", () => {
    expect(query(dashboardHref({ ...overview, propertyId: 7, reservationId: 19 }, { property: 8, view: "calendar" }))).toEqual({
      property: "8", overviewMonth: "2026-12", overviewSearch: "Studio & loft",
    });
    expect(query(dashboardHref({ ...overview, propertyId: 8 }, { property: null, reservation: null, view: "overview" }))).toEqual({
      view: "overview", overviewMonth: "2026-12", overviewSearch: "Studio & loft",
    });
  });

  it("accepts a year transition and an explicitly cleared filter", () => {
    expect(query(dashboardHref(overview, { view: "overview", overviewMonth: "2027-01", overviewSearch: "" }))).toEqual({
      view: "overview", overviewMonth: "2027-01",
    });
  });

  it("preserves existing default dashboard and property URLs", () => {
    const current = { ...overview, overviewMonth: null, overviewSearch: "" };
    expect(dashboardHref(current, {})).toBe("/dashboard");
    expect(dashboardHref(current, { property: 7 })).toBe("/dashboard?property=7");
    expect(dashboardHref(current, { property: 7, reservation: 19 })).toBe("/dashboard?property=7&reservation=19");
  });
});
