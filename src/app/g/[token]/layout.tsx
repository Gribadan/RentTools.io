import type { Metadata } from "next";
import type { ReactNode } from "react";

// /g/[token] = pre-arrival guest form, reached via a one-time share
// token. Token possession is the only auth — these URLs must NEVER be
// indexed because each one exposes guest data for a specific reservation.
// robots.txt also disallows /g/.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function GuestFormLayout({ children }: { children: ReactNode }) {
  return children;
}
