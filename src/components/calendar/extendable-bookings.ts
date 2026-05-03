import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
import { toDateStr, addDaysStr } from "./utils";
import type { CalendarEvent } from "./types";

export function getExtendableBookings(
  dateStr: string,
  syncedEvents: CalendarEvent[],
  reservations: Property["reservations"]
): ExtendableBooking[] {
  const result: ExtendableBooking[] = [];
  const dayAfter = addDaysStr(dateStr, 1);

  for (const ev of syncedEvents) {
    const isBlock = ev.platform === "airbnb" && (ev.summary.includes("Not available") || ev.summary.includes("Blocked"));
    if (isBlock) continue;
    if (ev.startDate === dayAfter) {
      result.push({ name: ev.summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"), platform: ev.platform, eventUid: ev.uid, side: "before" });
    }
    if (ev.endDate === dateStr) {
      result.push({ name: ev.summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"), platform: ev.platform, eventUid: ev.uid, side: "after" });
    }
  }

  for (const res of reservations) {
    const rStart = toDateStr(new Date(res.checkIn));
    const rEnd = toDateStr(new Date(res.checkOut));
    if (rStart === dayAfter) result.push({ name: res.name, platform: res.platform, side: "before" });
    if (rEnd === dateStr) result.push({ name: res.name, platform: res.platform, side: "after" });
  }

  return result;
}
