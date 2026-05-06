export interface Guest {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  country: string;
  citizenshipCode: string;
  dateOfBirth: string;
  yearsOld: number;
  gender: string;
  dateOfIssue: string;
  expiryDate: string;
  passportNumber: string;
  issuedBy: string;
  visaNumber: string;
  visaFrom: string;
  visaTo: string;
  hasVisa: boolean;
  parentId: number | null;
  notes: string;
  phone: string;
  reservationId: number;
  createdAt: string;
}

export interface Reservation {
  id: number;
  name: string;
  checkIn: string;
  checkOut: string;
  platform: string;
  linkedEventUid?: string | null;
  propertyId: number;
  createdAt: string;
  guests?: Guest[];
  _count?: { guests: number };
}

export interface Property {
  id: number;
  userId: number; // owner
  name: string;
  minNights: number;
  checkInTime: string;  // "HH:MM" — guest arrival time, e.g. "14:00"
  checkOutTime: string; // "HH:MM" — guest departure time, e.g. "12:00"
  bookingWindow: number; // days forward from today to consider bookings; beyond this, events are ignored
  cleaningEnabled: boolean; // master toggle for buffer / sameDayCleaning / potentialCleaning / unbookable computation
  feedToken: string | null; // optional token gating the public iCal feed
  createdAt: string;
  reservations: Reservation[];
}

export interface CalendarLink {
  id: number;
  propertyId: number;
  platform: string;
  icalExportUrl: string;
  bufferBefore: number;
  bufferAfter: number;
  lastFetchedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface CalendarEvent {
  id: number;
  propertyId: number;
  platform: string;
  uid: string;
  summary: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface DateOverride {
  id: number;
  propertyId: number;
  date: string;
  type: "open" | "closed";
  note: string;
  createdAt: string;
}

/**
 * Compute the cutoff date string (YYYY-MM-DD) for a booking window.
 * Events starting on or after this date should be ignored.
 */
export function bookingWindowCutoff(windowDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + windowDays);
  return d.toISOString().substring(0, 10);
}

export interface SyncLogEntry {
  id: number;
  propertyId: number | null;
  level: string;
  message: string;
  createdAt: string;
}
