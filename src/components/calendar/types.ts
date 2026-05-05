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
  /** True when this segment is a continuation from a previous week or
   *  a previous month — the bar's actual startDate is earlier. We use
   *  it to drop the left rounding so wrap-around stays read as one
   *  reservation instead of looking like two separate ones. */
  continuesLeft: boolean;
  /** Symmetric: bar continues past this segment's last day (Sunday or
   *  end-of-month). Drops the right rounding for the same reason. */
  continuesRight: boolean;
}

export interface ConflictInfo {
  date: string;
  airbnbName: string;
  bookingName: string;
}
