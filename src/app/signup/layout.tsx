import type { Metadata } from "next";
import { applySeoOverrides } from "@/lib/seo";

// "RentTools" is appended automatically by the root layout's title template
// (`%s · RentTools`) — keeping the brand off the per-page title avoids the
// duplicated "Sign up — RentTools · RentTools" we shipped briefly.
const TITLE = "Sign up";
const DESCRIPTION =
  "Create a free RentTools account. Sync Airbnb + Booking.com calendars, automate cleaning, manage multiple properties from one dashboard.";

// /signup needs its own canonical because the root layout's default
// canonical points at "/", and an inherited canonical that mismatches
// the URL is a deindex signal — Google reads "I am the home page"
// from a non-home URL and drops the page from the index.
export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/signup" },
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url: "/signup",
      siteName: "RentTools",
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
  return applySeoOverrides(base, "/signup", "en");
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
