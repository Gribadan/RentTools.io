"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <KeyboardShortcuts />
    </I18nProvider>
  );
}
