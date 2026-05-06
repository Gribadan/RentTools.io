"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Locale, type TranslationKey } from "./translations";
import {
  isLocale,
  readLocaleCookieFromDocument,
  writeLocaleCookieToDocument,
} from "./cookie";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => translations[key]?.en || key,
});

const LEGACY_LOCALSTORAGE_KEY = "rent-tool-locale";

function isSecureContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.location.protocol === "https:";
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  // Server-resolved locale (URL prefix → header → cookie → "en"). Passing
  // it in means the first client paint already matches what the server
  // rendered, no hydration flash from a default locale.
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");

  useEffect(() => {
    // The server already passed in the URL-resolved locale via
    // initialLocale. We still run the cookie/legacy migration so a stale
    // localStorage entry from before the cookie migration gets cleaned
    // up — but we never *override* the URL-resolved locale. URL beats
    // cookie always; the cookie is now only a soft preference for
    // the next request.
    if (initialLocale) return;

    const fromCookie = readLocaleCookieFromDocument(
      typeof document !== "undefined" ? document : null
    );
    if (fromCookie) {
      setLocaleState(fromCookie);
      return;
    }

    try {
      const legacy = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
      if (isLocale(legacy)) {
        setLocaleState(legacy);
        writeLocaleCookieToDocument(
          typeof document !== "undefined" ? document : null,
          legacy,
          { secure: isSecureContext() }
        );
        localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
      }
    } catch {
      // localStorage unavailable (private mode, SSR, etc.) — ignore
    }
  }, [initialLocale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeLocaleCookieToDocument(
      typeof document !== "undefined" ? document : null,
      l,
      { secure: isSecureContext() }
    );
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const entry = translations[key];
      if (!entry) return key;
      let text: string = entry[locale] || entry.en;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
