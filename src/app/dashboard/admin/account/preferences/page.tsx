"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 3 — Language & theme sub-route. Wraps the existing
// ThemeToggle + LocaleSwitcher components in a labelled card layout
// instead of duplicating their logic.

interface CopyShape {
  title: string;
  subtitle: string;
  theme: string;
  themeHint: string;
  language: string;
  languageHint: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Language & theme",
    subtitle: "Saved per-browser — pick again on other devices.",
    theme: "Theme",
    themeHint: "Light or dark.",
    language: "Interface language",
    languageHint: "English or Russian.",
  },
  ru: {
    title: "Язык и тема",
    subtitle: "Эти настройки сохраняются в браузере — на других устройствах их нужно выбрать заново.",
    theme: "Тема оформления",
    themeHint: "Светлая или тёмная.",
    language: "Язык интерфейса",
    languageHint: "Английский или русский.",
  },
  de: {
    title: "Sprache & Design",
    subtitle: "Diese Einstellungen werden pro Browser gespeichert — auf anderen Geräten erneut auswählen.",
    theme: "Design",
    themeHint: "Hell oder dunkel.",
    language: "Sprache der Oberfläche",
    languageHint: "Englisch, Russisch oder Deutsch.",
  },
  fr: {
    title: "Langue et thème",
    subtitle: "Ces préférences sont enregistrées par navigateur — à choisir à nouveau sur les autres appareils.",
    theme: "Thème",
    themeHint: "Clair ou sombre.",
    language: "Langue de l'interface",
    languageHint: "Anglais, russe, allemand ou français.",
  },
};

export default function AdminPreferencesPage() {
  const { locale } = useI18n();
  const t = COPY[locale];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--ink)]">
              {t.theme}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-4)]">
              {t.themeHint}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--ink)]">
              {t.language}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-4)]">
              {t.languageHint}
            </p>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </div>
  );
}
