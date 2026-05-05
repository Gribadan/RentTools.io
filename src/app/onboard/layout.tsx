import type { Metadata } from "next";

const ONBOARD_TITLE = "Get started — sync your calendars in 30 seconds";
const ONBOARD_DESCRIPTION =
  "Paste your Airbnb and Booking.com calendar URLs, get sync feed URLs to paste back, then save your work to a free account. No signup required to try it.";

export const metadata: Metadata = {
  title: ONBOARD_TITLE,
  description: ONBOARD_DESCRIPTION,
  alternates: { canonical: "/onboard" },
  openGraph: {
    type: "website",
    title: `${ONBOARD_TITLE} · RentTools`,
    description: ONBOARD_DESCRIPTION,
    url: "/onboard",
    siteName: "RentTools",
  },
  twitter: {
    card: "summary_large_image",
    title: `${ONBOARD_TITLE} · RentTools`,
    description: ONBOARD_DESCRIPTION,
  },
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
