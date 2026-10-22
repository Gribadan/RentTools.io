export function isPlatformAvailabilityBlock(event: { platform: string; summary?: string | null }): boolean {
  // Booking's CLOSED entries can be real stays. Only Airbnb's known
  // availability markers distinguish a block from a reservation here.
  return event.platform === "airbnb" && /\b(?:not\s+available|blocked)\b/i.test(event.summary || "");
}
