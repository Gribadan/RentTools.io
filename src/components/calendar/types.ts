export interface CalendarEvent {
  id: number;
  platform: string;
  uid: string;
  summary: string;
  startDate: string;
  endDate: string;
}

export interface CalendarBar {
  startDate: string;
  endDate: string;
  name: string;
  platform: string;
  reservationId?: number;
  /** UID of the iCal event this bar comes from. Present when the bar
   *  was sourced from a synced feed; lets us link a future Reservation
   *  back to the original event when the user "claims" it. */
  eventUid?: string;
  isExtension?: boolean;
}

export interface BarSegment extends CalendarBar {
  span: number;
  leftPct: number;
  rightMarginPct: number;
  showLabel: boolean;
}

export interface ConflictInfo {
  date: string;
  airbnbName: string;
  bookingName: string;
}
