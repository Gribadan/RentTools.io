"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlatformInstructions } from "@/components/platform-instructions";
import { MarketingHeader } from "@/components/marketing-header";
import { useI18n } from "@/lib/i18n/context";
import { localePath } from "@/lib/i18n/alternates";
import type { Locale } from "@/lib/i18n/translations";

/* ────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────── */

interface DraftLink {
  platform: string;
  customName?: string;
  color?: string;
  icalExportUrl: string;
  lastTestStatus?: "valid" | "invalid";
}

interface DraftRow {
  /** Local-only id so the React key is stable across renders */
  rowId: string;
  /** Canonical platform slug. For custom platforms this is the slugified customName. */
  platform: string;
  /** Display name shown to the user. Editable for custom; fixed for presets. */
  customName?: string;
  /** Hex color for the platform pill */
  color: string;
  /** Whether the row is included in the saved draft + feed URL list */
  enabled: boolean;
  url: string;
  /** Local UI status — separate from saved status so the user sees fresh feedback */
  testStatus: "untested" | "testing" | "valid" | "invalid" | "error";
  testReason?: string;
  /** Toggle for the instructions panel */
  instructionsOpen: boolean;
}

interface Preset {
  platform: string;
  displayName: string;
  color: string;
  exportPlaceholder: string;
  /** Whether the existing PlatformInstructions component knows how to render
      tutorial content for this preset (today: airbnb + booking only). */
  hasInstructions: boolean;
}

const PRESETS: Preset[] = [
  {
    platform: "airbnb",
    displayName: "Airbnb",
    color: "#ff385c",
    exportPlaceholder: "https://www.airbnb.com/calendar/ical/…",
    hasInstructions: true,
  },
  {
    platform: "booking",
    displayName: "Booking.com",
    color: "#003580",
    exportPlaceholder: "https://admin.booking.com/…/ical.html?…",
    hasInstructions: true,
  },
  {
    platform: "vrbo",
    displayName: "Vrbo",
    color: "#2c5da9",
    exportPlaceholder: "https://www.vrbo.com/icalendar/…",
    hasInstructions: false,
  },
];

/** Cycle through this palette when auto-assigning a colour to a custom platform. */
const CUSTOM_PALETTE = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

/* ────────────────────────────────────────────────────────────────────
   Copy — typed per-locale lookup. Adding a new Locale to translations.ts
   forces every key here to be filled in (TS error otherwise).
──────────────────────────────────────────────────────────────────── */

interface CopyShape {
  introEyebrow: string;
  introTitleLead: string;
  introTitleAccent: string;
  introBody: string;
  loading: string;
  step1Title: string;
  step1Subtitle: string;
  step1Placeholder: string;
  step2Title: string;
  step2Subtitle: string;
  addAnotherPlatform: string;
  step3Title: string;
  step3SubtitleEmpty: string;
  signinPrefix: string;
  signinLink: string;
  signinSuffix: string;
  saving: string;
  saveAndCreate: string;
  /** Custom platform fallback display name */
  customFallback: string;
  /** aria-label `${enable} {display}` */
  enableAria: (display: string) => string;
  customNamePlaceholder: string;
  removePlatformAria: string;
  hideInstructions: (display: string) => string;
  showInstructions: (display: string) => string;
  icalExportLabel: (display: string) => string;
  invalidBadUrl: string;
  invalidUnreachable: string;
  invalidNotIcal: string;
  invalidGeneric: string;
  validOk: string;
  pasteBackLabel: (display: string) => string;
  feedUrlPlaceholder: string;
  copy: string;
  copied: string;
  feedHelp: string;
  testTesting: string;
  testValid: string;
  testRetry: string;
  testFresh: string;
  changeColor: string;
  /** Step 3 subtitle when at least one platform is enabled. */
  verifiedSubtitle: (validCount: number, enabledCount: number) => string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    introEyebrow: "Onboarding · Free for every property — forever",
    introTitleLead: "Set up your ",
    introTitleAccent: "first property",
    introBody:
      "Pick the platforms you list on, paste each one's iCal export URL, and copy the URLs we generate back into them. You can do this without an account first — sign up at the end to keep your data.",
    loading: "Loading…",
    step1Title: "Name your property",
    step1Subtitle: "Just a label for you. You can rename it later.",
    step1Placeholder: "My first property",
    step2Title: "Add calendar feeds",
    step2Subtitle:
      "Tick each platform you use — paste their iCal URL, copy ours back. Anything not on this list, add as Custom.",
    addAnotherPlatform: "Add another platform",
    step3Title: "Create your account",
    step3SubtitleEmpty:
      "You can sign up without picking a platform — add them later from the dashboard.",
    signinPrefix: "Forever free, no credit card. Already have an account? ",
    signinLink: "Sign in",
    signinSuffix: ".",
    saving: "Saving…",
    saveAndCreate: "Save and create account",
    customFallback: "Custom platform",
    enableAria: (display) => `Enable ${display}`,
    customNamePlaceholder: "Custom platform name",
    removePlatformAria: "Remove this platform",
    hideInstructions: (display) => `Hide instructions for ${display}`,
    showInstructions: (display) => `Show instructions for ${display}`,
    icalExportLabel: (display) => `${display} iCal export URL`,
    invalidBadUrl: "URL doesn't look right — check for missing https://",
    invalidUnreachable:
      "Couldn't reach that URL. The platform may be slow — try again in a minute.",
    invalidNotIcal:
      "URL responded but doesn't return a calendar. Double-check you copied the iCal export, not the listing page.",
    invalidGeneric:
      "Couldn't verify this URL — you can still save and we'll keep trying after signup.",
    validOk: "Looks good — we'll start syncing every 10 minutes after you sign up.",
    pasteBackLabel: (display) => `Paste this RentTools URL back into ${display}`,
    feedUrlPlaceholder: "URL appears once you save the property name above",
    copy: "Copy",
    copied: "Copied!",
    feedHelp:
      "This URL is yours forever — even after signup. It'll start serving live data once you complete signup.",
    testTesting: "Testing…",
    testValid: "Verified",
    testRetry: "Retry",
    testFresh: "Test fetch",
    changeColor: "Change color",
    verifiedSubtitle: (valid, enabled) =>
      `${valid} of ${enabled} platform${enabled === 1 ? "" : "s"} verified. Anything unverified you can fix after signup.`,
  },
  ru: {
    introEyebrow: "Старт · Бесплатно для любого числа объектов — навсегда",
    introTitleLead: "Настройте свой ",
    introTitleAccent: "первый объект",
    introBody:
      "Отметьте платформы, на которых вы сдаёте, вставьте iCal-ссылку с каждой и скопируйте наши обратно. Регистрироваться сразу не нужно — аккаунт пригодится в конце, чтобы сохранить настройки.",
    loading: "Загрузка…",
    step1Title: "Назовите объект",
    step1Subtitle: "Просто пометка для себя. Переименовать можно когда угодно.",
    step1Placeholder: "Мой первый объект",
    step2Title: "Подключите календари",
    step2Subtitle:
      "Отметьте платформы, которыми пользуетесь — вставьте их iCal-ссылку, скопируйте нашу обратно. Чего нет в списке — добавьте через «Своя платформа».",
    addAnotherPlatform: "Добавить ещё платформу",
    step3Title: "Создайте аккаунт",
    step3SubtitleEmpty:
      "Можно зарегистрироваться и без платформ — добавите их потом из панели.",
    signinPrefix: "Бесплатно навсегда, без карты. Уже есть аккаунт? ",
    signinLink: "Войти",
    signinSuffix: ".",
    saving: "Сохраняем…",
    saveAndCreate: "Сохранить и создать аккаунт",
    customFallback: "Своя платформа",
    enableAria: (display) => `Включить ${display}`,
    customNamePlaceholder: "Название платформы",
    removePlatformAria: "Удалить эту платформу",
    hideInstructions: (display) => `Скрыть инструкции для ${display}`,
    showInstructions: (display) => `Показать инструкции для ${display}`,
    icalExportLabel: (display) => `URL экспорта iCal · ${display}`,
    invalidBadUrl: "URL выглядит странно — проверьте, что там есть https://",
    invalidUnreachable:
      "Не удалось достучаться до URL. Платформа может тормозить — попробуйте через минуту.",
    invalidNotIcal:
      "URL отвечает, но это не календарь. Перепроверьте — нужен именно iCal-экспорт, а не страница объявления.",
    invalidGeneric:
      "Не получилось проверить URL — можно сохранить, мы продолжим попытки после регистрации.",
    validOk:
      "Всё в порядке — начнём синхронизацию каждые 10 минут, как только зарегистрируетесь.",
    pasteBackLabel: (display) => `Вставьте этот URL обратно в ${display}`,
    feedUrlPlaceholder: "URL появится после того, как вы зададите название объекта выше",
    copy: "Копировать",
    copied: "Скопировано!",
    feedHelp:
      "Эта ссылка — ваша навсегда. Начнёт отдавать живые данные сразу после регистрации.",
    testTesting: "Проверяем…",
    testValid: "Проверено",
    testRetry: "Ещё раз",
    testFresh: "Проверить",
    changeColor: "Сменить цвет",
    verifiedSubtitle: (valid, enabled) =>
      `Проверено ${valid} из ${enabled}. Что не прошло — поправите после регистрации.`,
  },
  de: {
    introEyebrow: "Einrichtung · Kostenlos für jede Unterkunft — für immer",
    introTitleLead: "Richten Sie Ihre ",
    introTitleAccent: "erste Unterkunft",
    introBody:
      "Wählen Sie die Plattformen, auf denen Sie inserieren, fügen Sie deren iCal-Export-URL ein und kopieren Sie die URLs zurück, die wir generieren. Geht erst einmal ohne Konto — am Ende registrieren, um die Daten zu sichern.",
    loading: "Wird geladen…",
    step1Title: "Geben Sie Ihrer Unterkunft einen Namen",
    step1Subtitle: "Nur ein Etikett für Sie. Können Sie jederzeit umbenennen.",
    step1Placeholder: "Meine erste Unterkunft",
    step2Title: "Kalender-Feeds hinzufügen",
    step2Subtitle:
      "Jede genutzte Plattform anhaken — deren iCal-URL einfügen, unsere zurückkopieren. Was nicht in der Liste steht, als „Eigene Plattform“ ergänzen.",
    addAnotherPlatform: "Weitere Plattform hinzufügen",
    step3Title: "Konto erstellen",
    step3SubtitleEmpty:
      "Sie können sich auch ohne ausgewählte Plattform registrieren — später aus dem Dashboard ergänzen.",
    signinPrefix: "Für immer kostenlos, keine Karte. Schon ein Konto? ",
    signinLink: "Anmelden",
    signinSuffix: ".",
    saving: "Speichern…",
    saveAndCreate: "Speichern und Konto erstellen",
    customFallback: "Eigene Plattform",
    enableAria: (display) => `${display} aktivieren`,
    customNamePlaceholder: "Name der Plattform",
    removePlatformAria: "Diese Plattform entfernen",
    hideInstructions: (display) => `Anleitung für ${display} ausblenden`,
    showInstructions: (display) => `Anleitung für ${display} anzeigen`,
    icalExportLabel: (display) => `iCal-Export-URL · ${display}`,
    invalidBadUrl: "Die URL sieht nicht richtig aus — fehlt vielleicht das https://?",
    invalidUnreachable:
      "URL nicht erreichbar. Die Plattform kann gerade träge sein — in einer Minute erneut versuchen.",
    invalidNotIcal:
      "Die URL antwortet, liefert aber keinen Kalender. Prüfen Sie, ob Sie wirklich den iCal-Export kopiert haben — und nicht die Inseratsseite.",
    invalidGeneric:
      "Diese URL konnten wir nicht prüfen — Sie können trotzdem speichern, wir versuchen es nach der Registrierung weiter.",
    validOk: "Sieht gut aus — wir starten den 10-Minuten-Sync, sobald Sie sich registriert haben.",
    pasteBackLabel: (display) => `Diese RentTools-URL zurück in ${display} einfügen`,
    feedUrlPlaceholder: "URL erscheint, sobald oben ein Name vergeben ist",
    copy: "Kopieren",
    copied: "Kopiert!",
    feedHelp:
      "Diese URL bleibt für immer Ihre — auch nach der Registrierung. Sobald die Registrierung abgeschlossen ist, liefert sie Live-Daten.",
    testTesting: "Wird geprüft…",
    testValid: "Geprüft",
    testRetry: "Erneut",
    testFresh: "Prüfen",
    changeColor: "Farbe ändern",
    verifiedSubtitle: (valid, enabled) =>
      `${valid} von ${enabled} ${enabled === 1 ? "Plattform" : "Plattformen"} geprüft. Was nicht durchgeht, beheben Sie nach der Registrierung.`,
  },
  fr: {
    introEyebrow: "Démarrage · Gratuit pour chaque logement — pour toujours",
    introTitleLead: "Configurez votre ",
    introTitleAccent: "premier logement",
    introBody:
      "Choisissez les plateformes sur lesquelles vous publiez, collez l’URL d’export iCal de chacune, puis recopiez chez elles les URL qu’on génère. Vous pouvez le faire sans compte au début — créez-en un à la fin pour conserver vos données.",
    loading: "Chargement…",
    step1Title: "Nommez votre logement",
    step1Subtitle: "Juste un libellé pour vous. Vous pourrez le renommer plus tard.",
    step1Placeholder: "Mon premier logement",
    step2Title: "Ajoutez les flux de calendrier",
    step2Subtitle:
      "Cochez chaque plateforme utilisée — collez son URL iCal, recopiez la nôtre. Ce qui n’est pas dans la liste, ajoutez-le en « Plateforme personnalisée ».",
    addAnotherPlatform: "Ajouter une autre plateforme",
    step3Title: "Créez votre compte",
    step3SubtitleEmpty:
      "Vous pouvez vous inscrire sans choisir de plateforme — ajoutez-les plus tard depuis le tableau de bord.",
    signinPrefix: "Gratuit pour toujours, sans carte bancaire. Vous avez déjà un compte ? ",
    signinLink: "Se connecter",
    signinSuffix: ".",
    saving: "Enregistrement…",
    saveAndCreate: "Enregistrer et créer le compte",
    customFallback: "Plateforme personnalisée",
    enableAria: (display) => `Activer ${display}`,
    customNamePlaceholder: "Nom de la plateforme",
    removePlatformAria: "Supprimer cette plateforme",
    hideInstructions: (display) => `Masquer les instructions pour ${display}`,
    showInstructions: (display) => `Afficher les instructions pour ${display}`,
    icalExportLabel: (display) => `URL d’export iCal · ${display}`,
    invalidBadUrl: "L’URL semble incorrecte — vérifiez qu’il y a bien https://",
    invalidUnreachable:
      "Impossible de joindre cette URL. La plateforme peut être lente — réessayez dans une minute.",
    invalidNotIcal:
      "L’URL répond, mais ne renvoie pas de calendrier. Vérifiez que vous avez bien copié l’export iCal et non la page de l’annonce.",
    invalidGeneric:
      "Impossible de vérifier cette URL — vous pouvez tout de même enregistrer, on continuera d’essayer après l’inscription.",
    validOk: "Tout bon — la synchronisation toutes les 10 minutes démarrera dès l’inscription.",
    pasteBackLabel: (display) => `Recollez cette URL RentTools dans ${display}`,
    feedUrlPlaceholder: "L’URL apparaît dès que vous nommez le logement ci-dessus",
    copy: "Copier",
    copied: "Copié !",
    feedHelp:
      "Cette URL est à vous pour toujours — même après l’inscription. Elle commencera à servir des données réelles dès que vous aurez terminé l’inscription.",
    testTesting: "Vérification…",
    testValid: "Vérifié",
    testRetry: "Réessayer",
    testFresh: "Tester",
    changeColor: "Changer la couleur",
    verifiedSubtitle: (valid, enabled) =>
      `${valid} sur ${enabled} ${enabled === 1 ? "plateforme vérifiée" : "plateformes vérifiées"}. Ce qui n’est pas validé se corrige après l’inscription.`,
  },
  es: {
    introEyebrow: "Inicio · Gratis para todos los alojamientos — para siempre",
    introTitleLead: "Configure su ",
    introTitleAccent: "primer alojamiento",
    introBody:
      "Marque las plataformas en las que publica, pegue la URL iCal de cada una y copie las nuestras de vuelta. Puede hacerlo sin cuenta primero — al final se registra para guardar los datos.",
    loading: "Cargando…",
    step1Title: "Póngale nombre al alojamiento",
    step1Subtitle: "Solo una etiqueta para usted. Puede renombrarlo cuando quiera.",
    step1Placeholder: "Mi primer alojamiento",
    step2Title: "Conecte los feeds de calendario",
    step2Subtitle:
      "Marque cada plataforma que use — pegue su URL iCal y copie la nuestra de vuelta. Lo que no esté en la lista, añádalo como «Plataforma personalizada».",
    addAnotherPlatform: "Añadir otra plataforma",
    step3Title: "Cree su cuenta",
    step3SubtitleEmpty:
      "Puede registrarse sin elegir plataforma — añádalas luego desde el panel.",
    signinPrefix: "Gratis para siempre, sin tarjeta. ¿Ya tiene cuenta? ",
    signinLink: "Iniciar sesión",
    signinSuffix: ".",
    saving: "Guardando…",
    saveAndCreate: "Guardar y crear cuenta",
    customFallback: "Plataforma personalizada",
    enableAria: (display) => `Activar ${display}`,
    customNamePlaceholder: "Nombre de la plataforma",
    removePlatformAria: "Quitar esta plataforma",
    hideInstructions: (display) => `Ocultar instrucciones para ${display}`,
    showInstructions: (display) => `Mostrar instrucciones para ${display}`,
    icalExportLabel: (display) => `URL de exportación iCal · ${display}`,
    invalidBadUrl: "La URL no tiene buena pinta — compruebe que empieza por https://",
    invalidUnreachable:
      "No hemos podido alcanzar esa URL. La plataforma puede ir lenta — inténtelo en un minuto.",
    invalidNotIcal:
      "La URL responde, pero no devuelve un calendario. Compruebe que copió la exportación iCal y no la página del anuncio.",
    invalidGeneric:
      "No hemos podido verificar esta URL — puede guardar igualmente y seguiremos intentándolo tras el registro.",
    validOk: "Todo en orden — empezamos a sincronizar cada 10 minutos en cuanto se registre.",
    pasteBackLabel: (display) => `Pegue esta URL de RentTools de vuelta en ${display}`,
    feedUrlPlaceholder: "La URL aparece en cuanto guarde el nombre del alojamiento arriba",
    copy: "Copiar",
    copied: "¡Copiado!",
    feedHelp:
      "Esta URL es suya para siempre — incluso después de registrarse. Empezará a servir datos en vivo en cuanto complete el registro.",
    testTesting: "Comprobando…",
    testValid: "Verificada",
    testRetry: "Reintentar",
    testFresh: "Probar",
    changeColor: "Cambiar color",
    verifiedSubtitle: (valid, enabled) =>
      `${valid} de ${enabled} ${enabled === 1 ? "plataforma verificada" : "plataformas verificadas"}. Lo que no se haya validado se arregla después del registro.`,
  },
};

/* ────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────── */

function newRowId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Mirror of slugify() in src/lib/slugify.ts but client-side. Kept tight —
    we only need the subset needed for picking a custom platform slug. */
function clientSlug(raw: string): string {
  if (!raw) return "custom";
  const cyr: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya", є: "ye", і: "i", ї: "yi", ґ: "g", ў: "u",
  };
  let out = "";
  for (const ch of raw) {
    const lower = ch.toLowerCase();
    out += cyr[lower] !== undefined ? cyr[lower] : lower.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  const cleaned = out
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return cleaned || "custom";
}

function feedUrl(slug: string, platform: string): string {
  // SSR-safe: window may not exist on first render
  const origin = typeof window === "undefined" ? "https://renttools.io" : window.location.origin;
  return `${origin}/api/calendar/feed/${slug}/for-${platform}.ics`;
}

function presetRow(preset: Preset): DraftRow {
  return {
    rowId: newRowId(),
    platform: preset.platform,
    color: preset.color,
    enabled: false,
    url: "",
    testStatus: "untested",
    instructionsOpen: false,
  };
}

/* ────────────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────────────── */

export default function OnboardPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const t = COPY[locale];
  const [propertyName, setPropertyName] = useState("");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<DraftRow[]>(() => PRESETS.map(presetRow));
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  /* ── hydrate from existing draft on mount ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { draft: { propertyName: string; feedSlug: string | null; links: DraftLink[] } | null } | null) => {
        if (cancelled) return;
        if (data?.draft) {
          setPropertyName(data.draft.propertyName);
          setFeedSlug(data.draft.feedSlug);
          // Hydrate rows: presets first, then any custom links from the draft.
          const seenPresets = new Set<string>();
          const hydrated: DraftRow[] = PRESETS.map((p) => {
            const link = data.draft!.links.find((l) => l.platform === p.platform);
            seenPresets.add(p.platform);
            return {
              ...presetRow(p),
              enabled: !!link,
              url: link?.icalExportUrl ?? "",
              testStatus: link?.lastTestStatus === "valid" ? "valid" : link?.lastTestStatus === "invalid" ? "invalid" : "untested",
            };
          });
          for (const link of data.draft.links) {
            if (seenPresets.has(link.platform)) continue;
            hydrated.push({
              rowId: newRowId(),
              platform: link.platform,
              customName: link.customName,
              color: link.color || CUSTOM_PALETTE[hydrated.length % CUSTOM_PALETTE.length],
              enabled: true,
              url: link.icalExportUrl,
              testStatus: link.lastTestStatus === "valid" ? "valid" : link.lastTestStatus === "invalid" ? "invalid" : "untested",
              instructionsOpen: false,
            });
          }
          setRows(hydrated);
        }
        setHydrated(true);
      })
      .catch(() => !cancelled && setHydrated(true));
    return () => { cancelled = true; };
  }, []);

  /* ── persist debounced ─────────────────────────────────────────── */
  const persist = useCallback(async (next: { propertyName: string; rows: DraftRow[] }) => {
    setSaving(true);
    try {
      const links: DraftLink[] = next.rows
        .filter((r) => r.enabled && r.url.trim())
        .map((r) => ({
          platform: r.platform,
          icalExportUrl: r.url.trim(),
          ...(r.customName ? { customName: r.customName } : {}),
          color: r.color,
          ...(r.testStatus === "valid" || r.testStatus === "invalid" ? { lastTestStatus: r.testStatus } : {}),
        }));
      // Auto-save: a single failed fetch is non-fatal — iOS Safari throws
      // "Load failed" when the user backgrounds the tab or the network
      // blips mid-request. Catch it locally so it doesn't bubble up as
      // an unhandled rejection; the next debounce cycle will retry the
      // moment the user edits anything else.
      let res: Response | undefined;
      try {
        res = await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyName: next.propertyName.trim(), links }),
        });
      } catch {
        return;
      }
      if (res.ok) {
        try {
          const data = await res.json();
          if (data?.draft?.feedSlug) setFeedSlug(data.draft.feedSlug);
        } catch {
          // Body unreadable (rare) — the next save cycle will refresh it.
        }
      }
    } finally {
      setSaving(false);
    }
  }, []);

  // Debounce persist on changes — 600ms after the last edit.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => persist({ propertyName, rows }), 600);
    return () => clearTimeout(timer);
  }, [hydrated, propertyName, rows, persist]);

  /* ── row mutations ─────────────────────────────────────────────── */
  const updateRow = useCallback((rowId: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  }, []);

  const toggleRow = useCallback((rowId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, enabled: !r.enabled, instructionsOpen: !r.enabled } : r))
    );
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  }, []);

  const addCustomRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        rowId: newRowId(),
        platform: `custom-${newRowId()}`,
        customName: "",
        color: CUSTOM_PALETTE[prev.length % CUSTOM_PALETTE.length],
        enabled: true,
        url: "",
        testStatus: "untested",
        instructionsOpen: false,
      },
    ]);
  }, []);

  const setCustomName = useCallback((rowId: string, customName: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        const slug = clientSlug(customName);
        // Avoid colliding with preset platform slugs by suffixing.
        const presetSlugs = new Set(PRESETS.map((p) => p.platform));
        const finalSlug = presetSlugs.has(slug) ? `${slug}-custom` : slug;
        return { ...r, customName, platform: finalSlug };
      })
    );
  }, []);

  /* ── per-row test fetch ───────────────────────────────────────── */
  const testRow = useCallback(async (rowId: string) => {
    const row = rows.find((r) => r.rowId === rowId);
    if (!row?.url.trim()) return;
    updateRow(rowId, { testStatus: "testing" });
    try {
      const res = await fetch("/api/onboard/test-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: row.url.trim() }),
      });
      const data = await res.json();
      updateRow(rowId, {
        testStatus: data.ok ? "valid" : "invalid",
        testReason: data.ok ? undefined : data.reason,
      });
    } catch {
      updateRow(rowId, { testStatus: "error", testReason: "network" });
    }
  }, [rows, updateRow]);

  /* ── copy to clipboard ────────────────────────────────────────── */
  const copyText = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* ignore — older browsers */
    }
  }, []);

  /* ── derived state ────────────────────────────────────────────── */
  const enabledCount = rows.filter((r) => r.enabled).length;
  const validCount = rows.filter((r) => r.enabled && r.testStatus === "valid").length;

  /* ── submit ───────────────────────────────────────────────────── */
  const handleSaveAndSignup = async () => {
    await persist({ propertyName, rows });
    router.push("/signup?from=onboard");
  };

  /* ── UI ───────────────────────────────────────────────────────── */
  return (
    <div className="editorial min-h-screen flex flex-col">
      {/* ── Header — shared with home + blog so a visitor never sees
            the chrome change. Same brand mark, same nav, same width. ── */}
      <MarketingHeader />

      {/* ── Main ── */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-14">
          {/* Intro hero — RT-25.8: hidden on <sm so the user lands
              directly on Step 1 above the fold. Free-for-everything
              wording replaces the old "1 property" line that read like
              a tier limit. */}
          <div className="hidden text-center sm:block">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
              {t.introEyebrow}
            </p>
            <h1 className="display mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)] sm:text-[44px]">
              {t.introTitleLead}
              <span className="italic font-normal">{t.introTitleAccent}</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-relaxed text-[var(--ink-2)]">
              {t.introBody}
            </p>
          </div>

          {!hydrated ? (
            <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-8 text-center text-sm text-[var(--ink-3)] sm:mt-10">
              {t.loading}
            </div>
          ) : (
            <div className="mt-6 space-y-6 sm:mt-10">
              {/* Step 1 — Property name */}
              <Card
                stepNumber={1}
                title={t.step1Title}
                subtitle={t.step1Subtitle}
              >
                <input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder={t.step1Placeholder}
                  className="h-11 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-[14px] text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)] transition-colors"
                  autoFocus
                />
              </Card>

              {/* Step 2 — Platform rows */}
              <Card
                stepNumber={2}
                title={t.step2Title}
                subtitle={t.step2Subtitle}
              >
                <div className="space-y-3">
                  {rows.map((row) => (
                    <PlatformRow
                      key={row.rowId}
                      row={row}
                      preset={PRESETS.find((p) => p.platform === row.platform) ?? null}
                      feedSlug={feedSlug}
                      copied={copied}
                      onToggle={() => toggleRow(row.rowId)}
                      onUrlChange={(url) => updateRow(row.rowId, { url, testStatus: "untested" })}
                      onCustomNameChange={(name) => setCustomName(row.rowId, name)}
                      onColorChange={(color) => updateRow(row.rowId, { color })}
                      onToggleInstructions={() => updateRow(row.rowId, { instructionsOpen: !row.instructionsOpen })}
                      onRemove={() => removeRow(row.rowId)}
                      onTest={() => testRow(row.rowId)}
                      onCopy={(text, key) => copyText(text, key)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCustomRow}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--line-2)] px-3 py-2 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--ink-3)] transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {t.addAnotherPlatform}
                </button>
              </Card>

              {/* Step 3 — Create account. Visually anchored as a third
                  numbered step so the three-step rhythm (name / feeds /
                  account) reads at a glance on a 1280px laptop. */}
              <Card
                stepNumber={3}
                title={t.step3Title}
                subtitle={
                  enabledCount === 0
                    ? t.step3SubtitleEmpty
                    : t.verifiedSubtitle(validCount, enabledCount)
                }
              >
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-[var(--ink-3)]">
                    {t.signinPrefix}
                    <Link href={localePath("/login", locale)} className="text-[var(--ink)] underline-offset-2 hover:underline">
                      {t.signinLink}
                    </Link>
                    {t.signinSuffix}
                  </p>
                  <button
                    onClick={handleSaveAndSignup}
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--m-accent)] px-6 text-[14px] font-medium text-white shadow-[0_2px_8px_rgba(255,56,92,0.2)] transition-all hover:bg-[var(--m-accent-2)] hover:translate-y-[-1px] disabled:opacity-50"
                  >
                    {saving ? t.saving : t.saveAndCreate}
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Components
──────────────────────────────────────────────────────────────────── */

function Card({
  stepNumber,
  title,
  subtitle,
  children,
}: {
  stepNumber?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6 sm:p-8">
      <div className="mb-5 flex items-start gap-3">
        {stepNumber !== undefined && (
          // Coloured numbered chip — RT-25.8. Coral pill anchors the
          // step visually so a returning user can scan "1 / 2 / 3"
          // without reading the headers.
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent)] text-[13px] font-semibold text-white shadow-sm shadow-[var(--m-accent)]/30"
          >
            {stepNumber}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold tracking-tight text-[var(--ink)]">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-2)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

interface PlatformRowProps {
  row: DraftRow;
  preset: Preset | null;
  feedSlug: string | null;
  copied: string | null;
  onToggle: () => void;
  onUrlChange: (v: string) => void;
  onCustomNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onToggleInstructions: () => void;
  onRemove: () => void;
  onTest: () => void;
  onCopy: (text: string, key: string) => void;
}

function PlatformRow({
  row,
  preset,
  feedSlug,
  copied,
  onToggle,
  onUrlChange,
  onCustomNameChange,
  onColorChange,
  onToggleInstructions,
  onRemove,
  onTest,
  onCopy,
}: PlatformRowProps) {
  const { locale } = useI18n();
  const t = COPY[locale];
  const isCustom = !preset;
  const display = preset?.displayName ?? (row.customName?.trim() || t.customFallback);
  const ourFeedUrl = feedSlug ? feedUrl(feedSlug, row.platform) : null;
  const copyKey = `our-${row.rowId}`;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] transition-colors hover:border-[var(--line-2)]">
      {/* Header row: enabled toggle + name + color + remove (if custom).
          The whole row is the toggle target — clicking anywhere on it
          enables/disables the platform. The genuinely interactive
          children (checkbox, custom-name input, colour swatch, remove)
          stop propagation so they keep their own behaviour. */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none rounded-t-lg transition-colors hover:bg-[var(--bg-2)]"
        onClick={onToggle}
      >
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={t.enableAria(display)}
          className="h-4 w-4 cursor-pointer accent-[var(--m-accent)]"
        />
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: row.color }}
          aria-hidden="true"
        />
        {isCustom ? (
          <input
            value={row.customName ?? ""}
            onChange={(e) => onCustomNameChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={t.customNamePlaceholder}
            className="flex-1 bg-transparent text-[14px] font-medium text-[var(--ink)] placeholder-[var(--ink-4)] outline-none"
          />
        ) : (
          <span className="flex-1 text-[14px] font-medium text-[var(--ink)]">{display}</span>
        )}
        {row.enabled && (
          <span onClick={(e) => e.stopPropagation()}>
            <ColorSwatchButton color={row.color} onChange={onColorChange} />
          </span>
        )}
        {isCustom && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-[var(--ink-4)] hover:text-[var(--ink-2)] transition-colors"
            aria-label={t.removePlatformAria}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Body — URL inputs + test + RentTools URL — only when enabled */}
      {row.enabled && (
        <div className="border-t border-[var(--line)] px-4 py-4 space-y-3">
          {preset?.hasInstructions && (
            <button
              type="button"
              onClick={onToggleInstructions}
              className="text-[12px] text-[var(--ink-3)] hover:text-[var(--ink)] inline-flex items-center gap-1"
            >
              <svg className={`h-3 w-3 transition-transform ${row.instructionsOpen ? "rotate-90" : ""}`} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {row.instructionsOpen ? t.hideInstructions(display) : t.showInstructions(display)}
            </button>
          )}
          {row.instructionsOpen && preset?.hasInstructions && (preset.platform === "airbnb" || preset.platform === "booking") && (
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-3">
              <PlatformInstructions platform={preset.platform} mode="export" />
            </div>
          )}

          {/* URL input + test button */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--ink-2)] mb-1.5">
              {t.icalExportLabel(display)}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={row.url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder={preset?.exportPlaceholder ?? "https://…"}
                className="h-10 w-full min-w-0 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)] transition-colors sm:flex-1"
              />
              <TestButton status={row.testStatus} onClick={onTest} disabled={!row.url.trim()} />
            </div>
            {row.testStatus === "invalid" && (
              <p className="mt-1.5 text-[11.5px] text-rose-700">
                {row.testReason === "bad_url"
                  ? t.invalidBadUrl
                  : row.testReason === "unreachable"
                    ? t.invalidUnreachable
                    : row.testReason === "not_ical"
                      ? t.invalidNotIcal
                      : t.invalidGeneric}
              </p>
            )}
            {row.testStatus === "valid" && (
              <p className="mt-1.5 text-[11.5px] text-emerald-700">
                {t.validOk}
              </p>
            )}
          </div>

          {/* RentTools feed URL for this platform */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--ink-2)] mb-1.5">
              {t.pasteBackLabel(display)}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="h-10 w-full min-w-0 select-all rounded-md border border-[var(--line)] bg-[var(--bg-2)] px-3 text-[12px] text-[var(--ink-2)] flex items-center overflow-x-auto whitespace-nowrap sm:flex-1">
                {ourFeedUrl ?? t.feedUrlPlaceholder}
              </code>
              <button
                type="button"
                onClick={() => ourFeedUrl && onCopy(ourFeedUrl, copyKey)}
                disabled={!ourFeedUrl}
                className="h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-[12.5px] text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors disabled:opacity-40 sm:w-auto"
              >
                {copied === copyKey ? t.copied : t.copy}
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-[var(--ink-3)]">
              {t.feedHelp}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TestButton({ status, onClick, disabled }: { status: DraftRow["testStatus"]; onClick: () => void; disabled?: boolean }) {
  const { locale } = useI18n();
  const t = COPY[locale];
  const label =
    status === "testing"
      ? t.testTesting
      : status === "valid"
        ? t.testValid
        : status === "invalid" || status === "error"
          ? t.testRetry
          : t.testFresh;
  const tone =
    status === "valid"
      ? "border-transparent bg-emerald-700 text-white"
      : status === "invalid" || status === "error"
        ? "border-rose-700 bg-[var(--bg)] text-rose-700"
        : "border-[var(--line-2)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--bg-2)]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === "testing"}
      className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-40 sm:w-auto ${tone}`}
      aria-live="polite"
    >
      {status === "valid" && (
        <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {(status === "invalid" || status === "error") && (
        <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

function ColorSwatchButton({ color, onChange }: { color: string; onChange: (v: string) => void }) {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-5 w-5 rounded-md border border-[var(--line-2)] hover:border-[var(--ink-3)] transition-colors"
        style={{ backgroundColor: color }}
        aria-label={t.changeColor}
      />
      {open && (
        <div className="absolute right-0 top-7 z-10 flex gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-2 shadow-lg">
          {[...CUSTOM_PALETTE, "#ff385c", "#003580"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className="h-5 w-5 rounded-md border border-[var(--line-2)] transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
              aria-label={`Set color to ${c}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
