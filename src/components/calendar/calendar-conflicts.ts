import { addDaysStr } from "./utils";
import type { ConflictInfo } from "./types";

interface Occupancy {
  name: string;
  platform: string;
  startDate: string;
  endDate: string;
  reservationId?: number;
  isAvailabilityBlock?: boolean;
}

export function calendarConflicts(entries: Iterable<Occupancy>) {
  const stays = [...entries].filter(entry => !entry.isAvailabilityBlock);
  const byDate = new Map<string, Set<Occupancy>>();
  const datesByEntry = new Map<Occupancy, Set<string>>();
  for (let i = 0; i < stays.length; i++) {
    for (let j = i + 1; j < stays.length; j++) {
      const a = stays[i];
      const b = stays[j];
      // One provider can publish overlapping inventory fragments. Within
      // that channel, only distinct local reservations prove separate stays.
      if (a.platform === b.platform && (!a.reservationId || !b.reservationId || a.reservationId === b.reservationId)) continue;
      const start = a.startDate > b.startDate ? a.startDate : b.startDate;
      const end = a.endDate < b.endDate ? a.endDate : b.endDate;
      for (let date = start; date < end; date = addDaysStr(date, 1)) {
        const occupants = byDate.get(date) ?? new Set<Occupancy>();
        occupants.add(a).add(b);
        byDate.set(date, occupants);
        for (const entry of [a, b]) {
          const dates = datesByEntry.get(entry) ?? new Set<string>();
          dates.add(date);
          datesByEntry.set(entry, dates);
        }
      }
    }
  }
  const conflicts: ConflictInfo[] = [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, occupants]) => ({
    date,
    bookings: [...occupants].map(({ platform, name }) => ({ platform, name })),
  }));
  return { conflicts, dates: new Set(conflicts.map(conflict => conflict.date)), datesByEntry };
}
