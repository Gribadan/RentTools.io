import type { Metadata } from "next";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { localizedAlternates } from "@/lib/i18n/alternates";
import { toOgLocale } from "@/lib/i18n/locale-tags";
import type { Locale } from "@/lib/i18n/translations";

// Per-locale title/description so the SERP entry actually reads as
// native copy in each market. Title length stays under ~60 chars
// (Google truncation point) in both languages.
const ONBOARD_COPY: Record<Locale, { title: string; description: string }> = {
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
  de: {
    title: "Loslegen — Kalender in 30 Sekunden synchronisieren",
    description:
      "Airbnb- und Booking.com-Kalender-URLs einfügen, Ihre iCal-Links holen und in einem kostenlosen Konto speichern. Zum Ausprobieren keine Registrierung nötig.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = ONBOARD_COPY[locale];
  const alts = localizedAlternates("/onboard", locale);
  const ogLocale = toOgLocale(locale);
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
      locale: ogLocale,
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
