import { describe, expect, it } from "vitest";
import { planStay, type PropertyStayRules } from "./stay-plan";
import type { CalendarBar } from "./types";

// Airbnb guest checks in 25 Sept, out 29 Sept. endDate is the
// check-OUT day, so the nights sold are 25..28.
const airbnb: CalendarBar = {
  startDate: "2026-09-25",
  endDate: "2026-09-29",
  name: "Reserved",
  platform: "airbnb",
};

const quick: PropertyStayRules = { cleaningEnabled: true, bufferBefore: 0 };
const full: PropertyStayRules = { cleaningEnabled: true, bufferBefore: 1 };

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `2026-09-${String(from + i).padStart(2, "0")}`);

describe("planStay", () => {
  it("returns null for an empty selection", () => {
    expect(planStay([], [airbnb], quick)).toBeNull();
  });

  it("treats each selected day as a night, checking out the morning after", () => {
    const plan = planStay(range(15, 24), [airbnb], quick)!;
    expect(plan).toMatchObject({
      checkIn: "2026-09-15",
      checkOut: "2026-09-25",
      nights: 10,
      isTurnover: false,
      blockedBy: null,
    });
  });

  it("reads a trailing check-in day as check-out on a same-day-turnover property", () => {
    const plan = planStay(range(15, 25), [airbnb], quick)!;
    expect(plan).toMatchObject({
      checkIn: "2026-09-15",
      checkOut: "2026-09-25",
      nights: 10,
      isTurnover: true,
      blockedBy: null,
    });
  });

  it("selecting through the check-in day yields the same stay as stopping before it", () => {
    const stopShort = planStay(range(15, 24), [airbnb], quick)!;
    const throughCheckIn = planStay(range(15, 25), [airbnb], quick)!;
    expect(throughCheckIn.checkIn).toBe(stopShort.checkIn);
    expect(throughCheckIn.checkOut).toBe(stopShort.checkOut);
    expect(throughCheckIn.nights).toBe(stopShort.nights);
  });

  it("refuses the turnover when the property reserves a buffer before check-in", () => {
    const plan = planStay(range(15, 25), [airbnb], full)!;
    expect(plan.isTurnover).toBe(true);
    expect(plan.blockedBy).toBe("buffer-required");
  });

  it("allows the turnover when cleaning is disabled, buffer setting notwithstanding", () => {
    const plan = planStay(range(15, 25), [airbnb], { cleaningEnabled: false, bufferBefore: 3 })!;
    expect(plan.blockedBy).toBeNull();
    expect(plan.nights).toBe(10);
  });

  it("blocks when a genuinely sold night is selected", () => {
    // 26 Sept is mid-stay for the Airbnb guest.
    const plan = planStay(range(15, 26), [airbnb], quick)!;
    expect(plan.isTurnover).toBe(false);
    expect(plan.blockedBy).toBe("occupied");
  });

  it("blocks when the trailing day is a check-in but an earlier night is also sold", () => {
    const earlier: CalendarBar = {
      startDate: "2026-09-17",
      endDate: "2026-09-19",
      name: "Booking guest",
      platform: "booking",
    };
    const plan = planStay(range(15, 25), [airbnb, earlier], quick)!;
    expect(plan.blockedBy).toBe("occupied");
  });

  it("blocks a lone check-in day — dropping it would leave zero nights", () => {
    const plan = planStay(["2026-09-25"], [airbnb], quick)!;
    expect(plan.nights).toBe(0);
    expect(plan.blockedBy).toBe("occupied");
  });

  it("lets a stay start on an existing check-out day (back-to-back)", () => {
    // 29 Sept is the Airbnb check-out; its night is free.
    const plan = planStay(range(29, 30), [airbnb], quick)!;
    expect(plan).toMatchObject({
      checkIn: "2026-09-29",
      checkOut: "2026-10-01",
      nights: 2,
      blockedBy: null,
    });
  });
});
