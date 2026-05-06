import type { Metadata } from "next";
import { applySeoOverrides } from "@/lib/seo";

const TITLE = "Sign in — RentTools";
const DESCRIPTION =
  "Sign in to RentTools to manage your short-term rental calendars, cleaning schedules, and guest data.";

// /login needs its own canonical — see signup/layout.tsx for the
// "inherited canonical = deindex" rationale.
export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/login" },
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url: "/login",
      siteName: "RentTools",
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
  return applySeoOverrides(base, "/login", "en");
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
