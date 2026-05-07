import type { Metadata } from "next";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { localizedAlternates } from "@/lib/i18n/alternates";
import { toOgLocale } from "@/lib/i18n/locale-tags";
import type { Locale } from "@/lib/i18n/translations";

// See signup/layout.tsx — title template appends "· RentTools" automatically.
const LOGIN_COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Sign in",
    description:
      "Sign in to RentTools to manage your short-term rental calendars, cleaning schedules, and guest data.",
  },
  ru: {
    title: "Войти",
    description:
      "Войдите в RentTools, чтобы управлять календарями аренды, расписанием уборок и данными гостей.",
  },
  de: {
    title: "Anmelden",
    description:
      "Melden Sie sich bei RentTools an, um Mietkalender, Reinigungspläne und Gastdaten zu verwalten.",
  },
  fr: {
    title: "Se connecter",
    description:
      "Connectez-vous à RentTools pour gérer vos calendriers de location, vos plannings de ménage et vos données voyageurs.",
  },
};

// /login needs its own canonical — see signup/layout.tsx for the
// "inherited canonical = deindex" rationale.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = LOGIN_COPY[locale];
  const alts = localizedAlternates("/login", locale);
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
      locale: toOgLocale(locale),
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
  };
  return applySeoOverrides(base, "/login", locale);
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
