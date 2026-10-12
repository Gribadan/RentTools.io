import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalendarDatePopover } from "./calendar-date-popover";
import type { CalendarBar } from "./types";

const stay: CalendarBar = {
  startDate: "2026-10-08",
  endDate: "2026-10-09",
  name: "Leaving guest",
  platform: "direct",
  reservationId: 1,
};

function renderSelection(
  selectedDates: string[],
  overrides: Partial<ComponentProps<typeof CalendarDatePopover>> = {},
): string {
  return renderToStaticMarkup(createElement(CalendarDatePopover, {
    selectedDates: new Set(selectedDates),
    bars: [stay],
    bufferDates: new Set<string>(),
    potentialDates: new Set<string>(),
    sameDayCleaningDates: new Set<string>(),
    unbookableDates: new Set<string>(),
    openOverrides: new Set<string>(),
    closedOverrides: new Set<string>(),
    cleaningOverrides: new Set<string>(),
    syncedEvents: [],
    reservations: [],
    cleaningEnabled: false,
    bufferBefore: 0,
    onClose: () => {},
    onToggleDate: () => {},
    onSetSingleOverride: () => {},
    onRemoveSingleOverride: () => {},
    onSetBulkOverride: () => {},
    onRemoveBulkOverride: () => {},
    onExtendBooking: async () => ({ ok: true }),
    onCreateReservation: async () => {},
    onTrimReservation: () => {},
    ...overrides,
  }));
}

describe("checkout-night calendar actions", () => {
  it.each(["direct", "airbnb", "booking"])(
    "allows a new stay or manual block on a %s checkout date",
    (platform) => {
      const markup = renderSelection(["2026-10-09"], {
        bars: [{ ...stay, platform }],
      });
      expect(markup).toContain("Create reservation");
      expect(markup).toContain("Block this date");
      expect(markup).toContain("checking out");
      expect(markup).toContain(">Free</span>");
      expect(markup).not.toContain("Booked by");
    },
  );

  it("keeps cleaning controls and offers a block on the free checkout night", () => {
    const markup = renderSelection(["2026-10-09"], {
      cleaningEnabled: true,
      sameDayCleaningDates: new Set(["2026-10-09"]),
    });
    expect(markup).toContain("Create reservation");
    expect(markup).toContain("Block this date");
    expect(markup).toContain("Cancel cleaning");
    expect(markup).not.toContain("Booked by");
  });

  it("offers unblock for a closed checkout night while retaining the leaving stay", () => {
    const markup = renderSelection(["2026-10-09"], {
      closedOverrides: new Set(["2026-10-09"]),
    });
    expect(markup).toContain("Unblock this date");
    expect(markup).toContain("Create reservation");
    expect(markup).toContain("checking out");
    expect(markup).not.toContain("Booked by");
  });

  it.each(["2026-10-08", "2026-10-09"])(
    "does not offer a new stay or block when the night of %s is occupied",
    (date) => {
      const markup = renderSelection([date], {
        bars: [stay, {
          ...stay,
          startDate: "2026-10-09",
          endDate: "2026-10-12",
          name: "Arriving guest",
          reservationId: 2,
        }],
      });
      expect(markup).not.toContain("Create reservation");
      expect(markup).not.toContain("Block this date");
      expect(markup).toContain("Schedule cleaning");
    },
  );

  it("preserves checkout trim controls on a longer manual stay", () => {
    const markup = renderSelection(["2026-10-09"], {
      bars: [{ ...stay, startDate: "2026-10-06" }],
    });
    expect(markup).toContain("Create reservation");
    expect(markup).toContain("Remove 09 Oct from reservation");
  });

  it("treats checkout and the following selected date as two free nights", () => {
    const markup = renderSelection(["2026-10-09", "2026-10-10"]);
    expect(markup).toContain("Create reservation (2 nights)");
    expect(markup).toContain("check-in 09 Oct, check-out 11 Oct");
    expect(markup).toContain("Block all (2)");
    expect(markup).not.toContain("booked — bulk actions disabled");
  });
});
