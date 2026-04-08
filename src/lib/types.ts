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
  reservationId: number;
  createdAt: string;
}

export interface Reservation {
  id: number;
  name: string;
  checkIn: string;
  checkOut: string;
  platform: string;
  propertyId: number;
  createdAt: string;
  guests?: Guest[];
  _count?: { guests: number };
}

export interface Property {
  id: number;
  name: string;
  minNights: number;
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

export interface SyncLogEntry {
  id: number;
  propertyId: number | null;
  level: string;
  message: string;
  createdAt: string;
}
