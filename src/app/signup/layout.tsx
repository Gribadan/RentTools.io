import type { Metadata } from "next";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { localizedAlternates } from "@/lib/i18n/alternates";

// "RentTools" is appended automatically by the root layout's title template
// (`%s · RentTools`) — keeping the brand off the per-page title avoids the
// duplicated "Sign up — RentTools · RentTools" we shipped briefly.
const SIGNUP_COPY: Record<"en" | "ru", { title: string; description: string }> = {
  en: {
    title: "Sign up",
    description:
      "Create a free RentTools account. Sync Airbnb + Booking.com calendars, automate cleaning, manage multiple properties from one dashboard.",
  },
  ru: {
    title: "Регистрация",
    description:
      "Создайте бесплатный аккаунт RentTools. Синхронизация Airbnb и Booking.com, автоматизация уборок, несколько объектов в одной панели.",
  },
};

// /signup needs its own canonical because the root layout's default
// canonical points at "/", and an inherited canonical that mismatches
// the URL is a deindex signal — Google reads "I am the home page"
// from a non-home URL and drops the page from the index.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = SIGNUP_COPY[locale];
  const alts = localizedAlternates("/signup", locale);
  const base: Metadata = {
    title: copy.title,
    description: copy.description,
    alternates: alts,
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: alts.canonical,
      siteName: "RentTools",
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
  };
  return applySeoOverrides(base, "/signup", locale);
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
