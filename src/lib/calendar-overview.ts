import type { Reservation } from "@/lib/types";

export interface CalendarOverviewReservation {
  id?: number;
  name: string;
  checkIn: string;
  checkOut: string;
  platform: string;
  linkedEventUid: string | null;
  linkedEventPlatform: string | null;
  linkedEventRole: Reservation["linkedEventRole"];
}

export interface CalendarOverviewEvent {
  platform: string;
  uid: string;
  summary: string;
  startDate: string;
  endDate: string;
}

export interface CalendarOverviewLink {
  platform: string;
  bufferBefore: number;
  bufferAfter: number;
}

export interface CalendarOverviewOverride {
  date: string;
  type: "open" | "closed" | "cleaning";
}

export interface CalendarOverviewProperty {
  id: number;
  name: string;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  bookingWindow: number;
  cleaningEnabled: boolean;
  canManage: boolean;
  reservations: CalendarOverviewReservation[];
  events: CalendarOverviewEvent[];
  links: CalendarOverviewLink[];
  overrides: CalendarOverviewOverride[];
  syncFailed: boolean;
}

export interface CalendarOverviewResponse {
  month: string;
  startDate: string;
  endDate: string;
  properties: CalendarOverviewProperty[];
}

export function calendarOverviewMonth(value: unknown): {
  month: string;
  startDate: string;
  endDate: string;
  start: Date;
  end: Date;
} | null {
  if (typeof value !== "string" || !/^(?:[1-9]\d{3})-(?:0[1-9]|1[0-2])$/.test(value)) return null;
  const start = new Date(`${value}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  if (end.getUTCFullYear() > 9999) return null;
  return { month: value, startDate: `${value}-01`, endDate: end.toISOString().slice(0, 10), start, end };
}
