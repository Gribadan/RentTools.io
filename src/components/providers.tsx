"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import type { Locale } from "@/lib/i18n/translations";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      {children}
      <KeyboardShortcuts />
    </I18nProvider>
  );
}
