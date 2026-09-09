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
  // Browser translation replaces React-owned text with <font> nodes. Sentry
  // recorded those nodes immediately before removeChild/insertBefore crashes.
  // The dashboard already provides its own language selector.
  return <div translate="no" className="notranslate">{children}</div>;
}
