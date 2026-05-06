"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { SessionProvider, type ClientSession } from "@/lib/session-context";
import type { Locale } from "@/lib/i18n/translations";

export function Providers({
  children,
  initialLocale,
  initialSession,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialSession: ClientSession | null;
}) {
  return (
    <SessionProvider initialSession={initialSession}>
      <I18nProvider initialLocale={initialLocale}>
        {children}
        <KeyboardShortcuts />
      </I18nProvider>
    </SessionProvider>
  );
}
