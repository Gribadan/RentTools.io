import type { MetadataRoute } from "next";
import { getLocale } from "@/lib/i18n/server";

/**
 * PWA manifest. Per-locale because the `name` / `short_name` /
 * `description` / `lang` fields surface in the OS install dialog and
 * the eventual home-screen label. A Russian visitor installing the
 * app from /ru/ should see "RentTools" with a Russian description,
 * and the OS tags the installed app `lang="ru"` (which influences
 * IME selection + screen-reader voice on some platforms).
 *
 * Adding a new language: extend the LOCALIZED block below. The
 * fallback path is English. `getLocale()` already resolves the URL
 * prefix → cookie → default chain, so this manifest reflects whatever
 * locale the install was initiated under.
 */

const LOCALIZED: Record<"en" | "ru", { name: string; description: string; lang: string }> = {
  en: {
    name: "RentTools",
    description:
      "Free, open-source property manager for short-term rental hosts. Sync Airbnb + Booking.com, automate cleaning.",
    lang: "en",
  },
  ru: {
    name: "RentTools",
    description:
      "Бесплатный менеджер для хостов краткосрочной аренды с открытым кодом. Синхронизация Airbnb и Booking.com, автоматизация уборок.",
    lang: "ru",
  },
};

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale();
  const copy = LOCALIZED[locale];
  return {
    name: copy.name,
    short_name: copy.name,
    description: copy.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#ff385c",
    background_color: "#fafaf9",
    lang: copy.lang,
    icons: [
      // SVG goes first so any browser that can rasterise it gets the
      // sharpest possible icon at any zoom level. PNG fallbacks for
      // stricter installers (Lighthouse audits PWA icon as PNG).
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
