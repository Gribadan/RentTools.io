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
