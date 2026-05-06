import type { Metadata } from "next";
import type { ReactNode } from "react";

// /dashboard and every nested route (admin, settings, calendar, …) is
// auth-walled — there is nothing here a crawler can usefully index, and
// the URLs are personalised per user. robots.txt already disallows the
// path; this is a belt-and-suspenders meta tag in case a crawler ignores
// robots.txt or a URL leaks into another index. Subtree-wide because
// page metadata inherits from the closest layout.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
