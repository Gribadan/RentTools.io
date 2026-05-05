import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
import { toDateStr, addDaysStr } from "./utils";
import type { CalendarEvent } from "./types";

/** Find events / reservations the current selection (a contiguous
 *  range startDate → endDate, inclusive) could be appended to. The
 *  returned bookings carry their own startDate / endDate so the
 *  side panel can show the host the full context (platform, guest
 *  name, original stay window) before they confirm.
 *
 *  Two adjacency rules:
 *    * "before" — the day AFTER the selected range equals the
 *                 booking's startDate. The selection prepends to it.
 *    * "after"  — the FIRST selected day equals the booking's
 *                 endDate (Airbnb / Booking iCal endDate is the
 *                 checkout day, so it doubles as the first night
 *                 of the extension). The selection appends.
 *
 *  For a single-date click the start === end, and the rules collapse
 *  to the original 1-day adjacency check.
 */
export function getExtendableBookings(
  startDate: string,
  endDate: string,
  syncedEvents: CalendarEvent[],
  reservations: Property["reservations"]
): ExtendableBooking[] {
  const result: ExtendableBooking[] = [];
  const dayAfter = addDaysStr(endDate, 1);

  for (const ev of syncedEvents) {
    const isBlock = ev.platform === "airbnb" && (ev.summary.includes("Not available") || ev.summary.includes("Blocked"));
    if (isBlock) continue;
    if (ev.startDate === dayAfter) {
      result.push({
        name: ev.summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"),
        platform: ev.platform,
        eventUid: ev.uid,
        bookingStart: ev.startDate,
        bookingEnd: ev.endDate,
        side: "before",
      });
    }
    if (ev.endDate === startDate) {
      result.push({
        name: ev.summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"),
        platform: ev.platform,
        eventUid: ev.uid,
        bookingStart: ev.startDate,
        bookingEnd: ev.endDate,
        side: "after",
      });
    }
  }

  for (const res of reservations) {
    const rStart = toDateStr(new Date(res.checkIn));
    const rEnd = toDateStr(new Date(res.checkOut));
    if (rStart === dayAfter) {
      result.push({
        name: res.name,
        platform: res.platform,
        bookingStart: rStart,
        bookingEnd: rEnd,
        side: "before",
      });
    }
    if (rEnd === startDate) {
      result.push({
        name: res.name,
        platform: res.platform,
        bookingStart: rStart,
        bookingEnd: rEnd,
        side: "after",
      });
    }
  }

  return result;
}
