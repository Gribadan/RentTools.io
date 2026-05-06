import type { Metadata } from "next";
import type { ReactNode } from "react";

// /invite/[token] = property-manager invite link. One-time token in the
// URL — must not be indexed. robots.txt also disallows /invite/, but a
// stray crawler that ignores robots.txt would still get blocked here.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function InviteLayout({ children }: { children: ReactNode }) {
  return children;
}
