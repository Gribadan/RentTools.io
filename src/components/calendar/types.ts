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
  /** UID of the iCal event this bar's reservation EXTENDS. Present on a
   *  manual reservation that was added before/after a synced booking
   *  for the same guest (linkedEventUid on the Reservation row). Used
   *  to pair this bar with the synced bar so the calendar can render
   *  them as one continuous stay. */
  linkedEventUid?: string;
  /** Set during bar building when this bar is paired with a linked
   *  partner bar that abuts on the LEFT. Tells the renderer to drop
   *  the left-edge rounding so the pair reads as one stay. */
  linkedBefore?: boolean;
  /** Symmetric: a linked partner abuts on the RIGHT. */
  linkedAfter?: boolean;
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
