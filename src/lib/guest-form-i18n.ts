// Shared shapes + helpers for the multi-language pre-arrival guest
// form. English is the base language: it lives in GuestFormTemplate.name
// and each field's label / helpText / options. Other languages are
// optional host-authored overrides stored in GuestFormTemplate.i18n —
// a JSON object keyed by locale. A missing or blank translation
// transparently falls back to English, so a half-translated form is
// always still usable.

export const GUEST_FORM_LOCALES = ["en", "ru", "de", "fr", "es"] as const;
export type GuestFormLocale = (typeof GUEST_FORM_LOCALES)[number];

/** Locales the host can translate into — everything except the English
 *  base (which is edited through the normal name / field inputs). */
export const TRANSLATABLE_LOCALES = ["ru", "de", "fr", "es"] as const;

/** Native language names, shown in both the builder tabs and the
 *  guest-facing language picker. */
export const LOCALE_NATIVE_NAME: Record<GuestFormLocale, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

export interface FieldTranslation {
  label?: string;
  helpText?: string;
  /** Parallel to the base field's options array — index i translates
   *  base option i. A blank entry falls back to the English option. */
  options?: string[];
}

export interface LocaleTranslation {
  name?: string;
  fields?: Record<string, FieldTranslation>;
}

export type GuestFormI18n = Record<string, LocaleTranslation>;

interface BaseField {
  id: string;
  type: string;
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
}

/** Resolve a field's label / helpText / options for the chosen locale,
 *  falling back to the English base wherever a translation is missing
 *  or blank. Options fall back per-index so a partially-translated
 *  option list still renders. */
export function resolveField(
  field: BaseField,
  i18n: GuestFormI18n,
  locale: string,
): { label: string; helpText?: string; options?: string[] } {
  const tr = locale !== "en" ? i18n[locale]?.fields?.[field.id] : undefined;
  const label = tr?.label?.trim() ? tr.label : field.label;
  const helpText = tr?.helpText?.trim() ? tr.helpText : field.helpText;
  let options = field.options;
  if (field.options && tr?.options) {
    options = field.options.map((base, i) => {
      const t = tr.options?.[i];
      return typeof t === "string" && t.trim() ? t : base;
    });
  }
  return { label, helpText, options };
}

/** Resolve the form title for the chosen locale, falling back to the
 *  English base name. */
export function resolveName(
  baseName: string,
  i18n: GuestFormI18n,
  locale: string,
): string {
  if (locale !== "en") {
    const n = i18n[locale]?.name;
    if (typeof n === "string" && n.trim()) return n;
  }
  return baseName;
}

/** Which locales the guest may pick: English always, plus every locale
 *  the host actually authored some content for. */
export function availableLocales(i18n: GuestFormI18n): GuestFormLocale[] {
  const out: GuestFormLocale[] = ["en"];
  for (const loc of TRANSLATABLE_LOCALES) {
    const t = i18n[loc];
    if (!t) continue;
    const hasName = typeof t.name === "string" && t.name.trim().length > 0;
    const hasField =
      t.fields != null &&
      Object.values(t.fields).some(
        (f) =>
          (!!f.label && f.label.trim().length > 0) ||
          (!!f.helpText && f.helpText.trim().length > 0) ||
          (!!f.options && f.options.some((o) => !!o && o.trim().length > 0)),
      );
    if (hasName || hasField) out.push(loc);
  }
  return out;
}

/** Standing UI strings on the guest-facing form — the parts the host
 *  does NOT author (greeting, buttons, placeholders). Localised into
 *  the same five locales the guest can pick so a non-English guest
 *  sees a fully translated page, not a half-English one. */
export interface GuestUiCopy {
  greeting: (name: string) => string;
  intro: string;
  titleFallback: string;
  submit: string;
  submitting: string;
  thanks: string;
  submittedOn: (date: string) => string;
  selectPlaceholder: string;
  yes: string;
  no: string;
  language: string;
  submitFailed: string;
}

export const GUEST_UI_COPY: Record<GuestFormLocale, GuestUiCopy> = {
  en: {
    greeting: (n) => `Hi ${n}, please answer a few questions before your stay.`,
    intro: "Please answer a few questions before your stay.",
    titleFallback: "Pre-arrival form",
    submit: "Submit",
    submitting: "Submitting…",
    thanks: "Thanks — your answers are recorded.",
    submittedOn: (d) => `Submitted ${d}`,
    selectPlaceholder: "— select —",
    yes: "Yes",
    no: "No",
    language: "Language",
    submitFailed: "Submit failed",
  },
  ru: {
    greeting: (n) =>
      `Здравствуйте, ${n}! Пожалуйста, ответьте на несколько вопросов перед заездом.`,
    intro: "Пожалуйста, ответьте на несколько вопросов перед заездом.",
    titleFallback: "Анкета перед заездом",
    submit: "Отправить",
    submitting: "Отправка…",
    thanks: "Спасибо — ваши ответы сохранены.",
    submittedOn: (d) => `Отправлено ${d}`,
    selectPlaceholder: "— выберите —",
    yes: "Да",
    no: "Нет",
    language: "Язык",
    submitFailed: "Не удалось отправить",
  },
  de: {
    greeting: (n) =>
      `Hallo ${n}, bitte beantworten Sie vor Ihrem Aufenthalt einige Fragen.`,
    intro: "Bitte beantworten Sie vor Ihrem Aufenthalt einige Fragen.",
    titleFallback: "Formular vor der Anreise",
    submit: "Absenden",
    submitting: "Wird gesendet…",
    thanks: "Danke — Ihre Antworten wurden gespeichert.",
    submittedOn: (d) => `Gesendet am ${d}`,
    selectPlaceholder: "— auswählen —",
    yes: "Ja",
    no: "Nein",
    language: "Sprache",
    submitFailed: "Senden fehlgeschlagen",
  },
  fr: {
    greeting: (n) =>
      `Bonjour ${n}, merci de répondre à quelques questions avant votre séjour.`,
    intro: "Merci de répondre à quelques questions avant votre séjour.",
    titleFallback: "Formulaire avant l'arrivée",
    submit: "Envoyer",
    submitting: "Envoi…",
    thanks: "Merci — vos réponses ont été enregistrées.",
    submittedOn: (d) => `Envoyé le ${d}`,
    selectPlaceholder: "— sélectionner —",
    yes: "Oui",
    no: "Non",
    language: "Langue",
    submitFailed: "Échec de l'envoi",
  },
  es: {
    greeting: (n) =>
      `Hola ${n}, por favor responda algunas preguntas antes de su estancia.`,
    intro: "Por favor responda algunas preguntas antes de su estancia.",
    titleFallback: "Formulario previo a la llegada",
    submit: "Enviar",
    submitting: "Enviando…",
    thanks: "Gracias — sus respuestas han sido registradas.",
    submittedOn: (d) => `Enviado el ${d}`,
    selectPlaceholder: "— seleccionar —",
    yes: "Sí",
    no: "No",
    language: "Idioma",
    submitFailed: "Error al enviar",
  },
};

/** Validate an untrusted i18n blob at write time so a malformed PUT
 *  body cannot poison the JSON column. Unknown locales are dropped;
 *  empty translations are pruned so `availableLocales` stays accurate. */
export function sanitizeI18n(input: unknown): GuestFormI18n {
  if (!input || typeof input !== "object") return {};
  const out: GuestFormI18n = {};
  for (const loc of TRANSLATABLE_LOCALES) {
    const raw = (input as Record<string, unknown>)[loc];
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const entry: LocaleTranslation = {};
    if (typeof r.name === "string" && r.name.trim()) {
      entry.name = r.name.slice(0, 200);
    }
    if (r.fields && typeof r.fields === "object") {
      const fields: Record<string, FieldTranslation> = {};
      for (const [fid, fraw] of Object.entries(
        r.fields as Record<string, unknown>,
      )) {
        if (!fraw || typeof fraw !== "object") continue;
        const fr = fraw as Record<string, unknown>;
        const ft: FieldTranslation = {};
        if (typeof fr.label === "string" && fr.label.trim()) {
          ft.label = fr.label.slice(0, 200);
        }
        if (typeof fr.helpText === "string" && fr.helpText.trim()) {
          ft.helpText = fr.helpText.slice(0, 300);
        }
        if (Array.isArray(fr.options)) {
          const opts = fr.options
            .filter((o): o is string => typeof o === "string")
            .slice(0, 50)
            .map((o) => o.slice(0, 200));
          if (opts.some((o) => o.trim())) ft.options = opts;
        }
        if (ft.label || ft.helpText || ft.options) fields[fid] = ft;
      }
      if (Object.keys(fields).length > 0) entry.fields = fields;
    }
    if (entry.name || entry.fields) out[loc] = entry;
  }
  return out;
}
