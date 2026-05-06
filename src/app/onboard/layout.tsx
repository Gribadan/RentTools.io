import type { Metadata } from "next";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { localizedAlternates } from "@/lib/i18n/alternates";

// Per-locale title/description so the SERP entry actually reads as
// native copy in each market. Title length stays under ~60 chars
// (Google truncation point) in both languages.
const ONBOARD_COPY: Record<"en" | "ru", { title: string; description: string }> = {
  en: {
    title: "Get started — sync your calendars in 30 seconds",
    description:
      "Paste your Airbnb and Booking.com calendar URLs, get sync feed URLs to paste back, then save your work to a free account. No signup required to try it.",
  },
  ru: {
    title: "Начать — синхронизируйте календари за 30 секунд",
    description:
      "Вставьте ссылки на календари Airbnb и Booking.com, получите свои iCal-ссылки и сохраните в бесплатный аккаунт. Регистрация для пробы не нужна.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = ONBOARD_COPY[locale];
  const alts = localizedAlternates("/onboard", locale);
  const base: Metadata = {
    title: copy.title,
    description: copy.description,
    alternates: alts,
    openGraph: {
      type: "website",
      title: `${copy.title} · RentTools`,
      description: copy.description,
      url: alts.canonical,
      siteName: "RentTools",
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} · RentTools`,
      description: copy.description,
    },
  };
  return applySeoOverrides(base, "/onboard", locale);
}

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
