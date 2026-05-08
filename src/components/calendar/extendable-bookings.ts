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
 *  Adjacency rules — both based on the day immediately outside the
 *  bar's visible range:
 *    * "before" — the day AFTER the selected range equals the
 *                 booking's startDate (= clickedRange ends one day
 *                 before bar.startDate).
 *    * "after"  — the FIRST selected day equals booking.endDate + 1
 *                 (= clickedRange starts one day after bar.endDate).
 *
 *  Both rules require the click to be OUTSIDE the bar — the popover
 *  hides the extend section when any selected date is on a bar
 *  (`bulkCounts.booked === 0` gate), so adjacency rules that fired
 *  on the bar's own end cells could never surface. Previous
 *  behaviour did exactly that with the "after" rule
 *  (`endDate === clickedStart`) and was effectively dead code; the
 *  rule above is the correct adjacent-cell version.
 */
export function getExtendableBookings(
  startDate: string,
  endDate: string,
  syncedEvents: CalendarEvent[],
  reservations: Property["reservations"]
): ExtendableBooking[] {
  const result: ExtendableBooking[] = [];
  const dayAfterRange = addDaysStr(endDate, 1);

  for (const ev of syncedEvents) {
    // Filter out platform host-blocks (Airbnb's "Not available" /
    // "Blocked", Booking.com's "CLOSED - Not available"). Both
    // platforms publish a parallel block iCal that mirrors any
    // guest reservation, so without this filter the popover offers
    // the same stay twice — once as the named reservation, once as
    // the bracketing block — and the host has no way to tell them
    // apart. Match by summary substring across all platforms; the
    // strings are stable enough that a substring check is safe and
    // cheaper than carrying a per-platform allow-list.
    const summary = ev.summary || "";
    const isBlock =
      summary.includes("Not available") ||
      summary.includes("Blocked") ||
      summary.includes("CLOSED");
    if (isBlock) continue;
    if (ev.startDate === dayAfterRange) {
      result.push({
        name: summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"),
        platform: ev.platform,
        eventUid: ev.uid,
        bookingStart: ev.startDate,
        bookingEnd: ev.endDate,
        side: "before",
      });
    }
  }

  for (const res of reservations) {
    const rStart = toDateStr(new Date(res.checkIn));
    const rEnd = toDateStr(new Date(res.checkOut));
    const dayAfterReservation = addDaysStr(rEnd, 1);
    if (rStart === dayAfterRange) {
      result.push({
        name: res.name,
        platform: res.platform,
        reservationId: res.id,
        bookingStart: rStart,
        bookingEnd: rEnd,
        side: "before",
      });
    }
    // After-rule: the click lands on the day right after the
    // reservation's bar (rEnd + 1). Carries reservationId so the
    // parent handler can PATCH the existing reservation's checkOut
    // instead of creating a separate extension row — manual
    // reservations have no linkedEventUid, so a POST extension
    // wouldn't visually merge into the original bar (the bar
    // dedup + linked-pair logic both rely on shared eventUid /
    // linkedEventUid).
    if (dayAfterReservation === startDate) {
      result.push({
        name: res.name,
        platform: res.platform,
        reservationId: res.id,
        bookingStart: rStart,
        bookingEnd: rEnd,
        side: "after",
      });
    }
  }

  return result;
}
