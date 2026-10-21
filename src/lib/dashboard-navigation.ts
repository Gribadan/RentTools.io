interface DashboardLocation {
  propertyId: number | null;
  reservationId: number | null;
  overviewMonth: string | null;
  overviewSearch: string;
}

export interface DashboardNavigation {
  property?: number | null;
  reservation?: number | null;
  view?: string;
  overviewMonth?: string;
  overviewSearch?: string;
}

export function dashboardHref(current: DashboardLocation, next: DashboardNavigation): string {
  const propertyId = next.property !== undefined ? next.property : current.propertyId;
  const reservationId = next.reservation !== undefined
    ? next.reservation
    : next.property !== undefined ? null : current.reservationId;
  const defaultView = reservationId ? "guests" : propertyId ? "calendar" : "dashboard";
  const view = next.view || defaultView;
  const month = next.overviewMonth ?? current.overviewMonth;
  const query = next.overviewSearch ?? current.overviewSearch;
  const params = new URLSearchParams();

  if (propertyId) params.set("property", String(propertyId));
  if (reservationId) params.set("reservation", String(reservationId));
  if (view !== defaultView) params.set("view", view);
  if (month) params.set("overviewMonth", month);
  if (query) params.set("overviewSearch", query);

  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
}
