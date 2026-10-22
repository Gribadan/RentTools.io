import { describe, expect, it } from "vitest";
import { calendarOverviewMonth } from "./calendar-overview";

describe("overview calendar months", () => {
  it.each([null, "", "2026-1", "2026-00", "2026-13", "2026-10-01", "2026-10x", "9999-12", "0000-01", "2026-10 "])("rejects malformed month %s", (month) => {
    expect(calendarOverviewMonth(month)).toBeNull();
  });
  it.each([
    ["2026-12", "2026-12-01", "2027-01-01"],
    ["2027-01", "2027-01-01", "2027-02-01"],
    ["2028-02", "2028-02-01", "2028-03-01"],
  ])("keeps date-only boundaries for %s", (month, startDate, endDate) => {
    const range = calendarOverviewMonth(month)!;
    expect(range.startDate).toBe(startDate);
    expect(range.endDate).toBe(endDate);
    expect(range.start.toISOString()).toBe(`${startDate}T00:00:00.000Z`);
    expect(range.end.toISOString()).toBe(`${endDate}T00:00:00.000Z`);
  });
});
