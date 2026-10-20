import type { Reservation } from "@/lib/types";
import { toReservationDateInput } from "@/lib/reservation-dates";
import { calendarEventIdentity, linkedSourcePlatform } from "./linked-bookings";
import type { CalendarEvent } from "./types";

export interface ClaimSourceMismatch {
  reservationId: number;
  reservationName: string;
  platform: string;
  localCheckIn: string;
  localCheckOut: string;
  sourceCheckIn: string;
  sourceCheckOut: string;
  overlapsSource: boolean;
}

export function findClaimSourceMismatches(
  reservations: readonly Reservation[],
  events: readonly CalendarEvent[],
): ClaimSourceMismatch[] {
  const sources = new Map(events.map((event) => [
    calendarEventIdentity(event.platform, event.uid), event,
  ]));
  const mismatches: ClaimSourceMismatch[] = [];

  for (const reservation of reservations) {
    // Only an explicit claim identifies a source whose dates the host
    // expects to see; extensions and inferred legacy links do not.
    if (reservation.linkedEventRole !== "claim" || !reservation.linkedEventUid) continue;
    const platform = linkedSourcePlatform(reservation);
    if (!platform) continue;
    const source = sources.get(calendarEventIdentity(platform, reservation.linkedEventUid));
    if (!source) continue;

    const localCheckIn = toReservationDateInput(reservation.checkIn);
    const localCheckOut = toReservationDateInput(reservation.checkOut);
    const sourceCheckIn = toReservationDateInput(source.startDate);
    const sourceCheckOut = toReservationDateInput(source.endDate);
    if (!localCheckIn || !localCheckOut || !sourceCheckIn || !sourceCheckOut) continue;
    if (localCheckIn >= localCheckOut || sourceCheckIn >= sourceCheckOut) continue;
    if (localCheckIn === sourceCheckIn && localCheckOut === sourceCheckOut) continue;

    mismatches.push({
      reservationId: reservation.id,
      reservationName: reservation.name,
      platform,
      localCheckIn,
      localCheckOut,
      sourceCheckIn,
      sourceCheckOut,
      overlapsSource: localCheckIn < sourceCheckOut && localCheckOut > sourceCheckIn,
    });
  }

  return mismatches;
}
