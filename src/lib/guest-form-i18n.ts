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
  privacy: GuestPrivacyCopy;
}

/** Localised copy for the inline privacy / data-handling panel shown
 *  above the form. Goal: address the wary-guest concerns ("who hosts
 *  this, how is it managed, is data protection guaranteed") before
 *  they're asked to type anything. Default collapsed under a small
 *  "Details" toggle so it doesn't dominate the page for guests who
 *  don't care, but the always-visible summary is enough to reassure
 *  on its own. */
export interface GuestPrivacyCopy {
  /** Title row, always visible. */
  title: string;
  /** One-sentence summary, always visible. */
  summary: string;
  /** Toggle label when the panel is collapsed. */
  showDetails: string;
  /** Toggle label when the panel is expanded. */
  hideDetails: string;
  /** Bullet-point detail blocks shown when expanded. Title + body
   *  text — links are added by the rendering component. */
  bullets: { title: string; body: string }[];
  /** Trailing link label that points at the full /privacy policy. */
  fullPolicyLabel: string;
  /** Inline "GitHub source" link label (in the "Where it's stored"
   *  bullet — placed by the component to keep COPY plain text). */
  sourceLinkLabel: string;
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
    privacy: {
      title: "Privacy & data handling",
      summary:
        "Only your host sees your answers. Stored on RentTools.io — open-source software, HTTPS only, no tracking.",
      showDetails: "Details",
      hideDetails: "Hide",
      bullets: [
        {
          title: "Who sees this",
          body: "Only the host of the property you booked. Answers go straight to their RentTools account. Nothing is shared, sold, or used for advertising.",
        },
        {
          title: "Where it's stored",
          body: "RentTools.io is an open-source tool — the source code is public so anyone can verify what happens to your data. The connection to this form is HTTPS-encrypted.",
        },
        {
          title: "No tracking",
          body: "No analytics, no advertising cookies, no third-party scripts are loaded on this page. Only the cookie required to keep your submission attached to your booking.",
        },
        {
          title: "Your rights (GDPR / UK GDPR)",
          body: "You can ask your host to delete your answers at any time, or contact the operator at support@renttools.io for any privacy question, access request, or complaint.",
        },
      ],
      fullPolicyLabel: "Read the full RentTools privacy policy",
      sourceLinkLabel: "source on GitHub",
    },
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
    privacy: {
      title: "Конфиденциальность и обработка данных",
      summary:
        "Ваши ответы видит только хозяин объекта. Данные хранятся на RentTools.io — открытое ПО, только HTTPS, без отслеживания.",
      showDetails: "Подробнее",
      hideDetails: "Свернуть",
      bullets: [
        {
          title: "Кто видит эти данные",
          body: "Только хозяин выбранного вами объекта. Ответы попадают сразу в его аккаунт RentTools. Мы не передаём, не продаём и не используем их в рекламных целях.",
        },
        {
          title: "Где хранятся данные",
          body: "RentTools.io — это открытое программное обеспечение, исходный код общедоступен, поэтому любой может проверить, что происходит с вашими данными. Соединение с этой формой защищено HTTPS-шифрованием.",
        },
        {
          title: "Никакого отслеживания",
          body: "На этой странице нет аналитики, рекламных cookies или сторонних скриптов. Используется только cookie, необходимый, чтобы связать ваш ответ с конкретной бронью.",
        },
        {
          title: "Ваши права (GDPR)",
          body: "Вы можете в любой момент попросить хозяина удалить ваши ответы или написать оператору по адресу support@renttools.io по любому вопросу о конфиденциальности, доступе к данным или жалобе.",
        },
      ],
      fullPolicyLabel: "Полная политика конфиденциальности RentTools",
      sourceLinkLabel: "исходный код на GitHub",
    },
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
    privacy: {
      title: "Datenschutz & Datenverarbeitung",
      summary:
        "Nur Ihr Gastgeber sieht Ihre Antworten. Gespeichert auf RentTools.io — Open-Source-Software, ausschließlich HTTPS, kein Tracking.",
      showDetails: "Details",
      hideDetails: "Ausblenden",
      bullets: [
        {
          title: "Wer sieht diese Angaben",
          body: "Nur der Gastgeber der von Ihnen gebuchten Unterkunft. Ihre Antworten gehen direkt in dessen RentTools-Konto. Es findet keine Weitergabe, kein Verkauf und keine Verwendung für Werbung statt.",
        },
        {
          title: "Wo werden die Daten gespeichert",
          body: "RentTools.io ist ein Open-Source-Werkzeug — der Quellcode ist öffentlich, jeder kann nachvollziehen, was mit Ihren Daten geschieht. Die Verbindung zu diesem Formular ist HTTPS-verschlüsselt.",
        },
        {
          title: "Kein Tracking",
          body: "Auf dieser Seite werden keine Analyse-Tools, keine Werbe-Cookies und keine Skripte Dritter geladen. Es wird nur das technisch notwendige Cookie gesetzt, um Ihre Antwort der Buchung zuzuordnen.",
        },
        {
          title: "Ihre Rechte (DSGVO)",
          body: "Sie können Ihren Gastgeber jederzeit auffordern, Ihre Antworten zu löschen, oder den Betreiber unter support@renttools.io zu allen Fragen rund um Datenschutz, Auskunft oder Beschwerde kontaktieren.",
        },
      ],
      fullPolicyLabel: "Vollständige Datenschutzerklärung von RentTools",
      sourceLinkLabel: "Quellcode auf GitHub",
    },
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
    privacy: {
      title: "Confidentialité et traitement des données",
      summary:
        "Seul votre hôte voit vos réponses. Stockées sur RentTools.io — logiciel open source, HTTPS uniquement, sans pistage.",
      showDetails: "Détails",
      hideDetails: "Masquer",
      bullets: [
        {
          title: "Qui voit ces informations",
          body: "Uniquement l'hôte du logement que vous avez réservé. Vos réponses sont transmises directement à son compte RentTools. Aucun partage, aucune vente, aucune utilisation à des fins publicitaires.",
        },
        {
          title: "Où elles sont stockées",
          body: "RentTools.io est un outil open source — le code source est public, ce qui permet à quiconque de vérifier ce qui est fait de vos données. La connexion à ce formulaire est chiffrée en HTTPS.",
        },
        {
          title: "Aucun pistage",
          body: "Aucun outil d'analyse, aucun cookie publicitaire ni script tiers n'est chargé sur cette page. Seul le cookie strictement nécessaire pour relier votre réponse à votre réservation est utilisé.",
        },
        {
          title: "Vos droits (RGPD)",
          body: "Vous pouvez à tout moment demander à votre hôte de supprimer vos réponses, ou écrire à l'opérateur à support@renttools.io pour toute question, demande d'accès ou réclamation concernant la confidentialité.",
        },
      ],
      fullPolicyLabel: "Politique de confidentialité complète de RentTools",
      sourceLinkLabel: "code source sur GitHub",
    },
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
    privacy: {
      title: "Privacidad y tratamiento de datos",
      summary:
        "Solo su anfitrión ve sus respuestas. Almacenadas en RentTools.io — software de código abierto, solo HTTPS, sin rastreo.",
      showDetails: "Detalles",
      hideDetails: "Ocultar",
      bullets: [
        {
          title: "Quién ve estos datos",
          body: "Solo el anfitrión del alojamiento que ha reservado. Sus respuestas llegan directamente a su cuenta de RentTools. No se comparten, no se venden y no se utilizan con fines publicitarios.",
        },
        {
          title: "Dónde se almacenan",
          body: "RentTools.io es una herramienta de código abierto — el código fuente es público, por lo que cualquiera puede verificar qué se hace con sus datos. La conexión con este formulario está cifrada por HTTPS.",
        },
        {
          title: "Sin rastreo",
          body: "En esta página no se carga ninguna herramienta de analítica, ninguna cookie publicitaria ni ningún script de terceros. Solo se usa la cookie estrictamente necesaria para vincular su respuesta con la reserva.",
        },
        {
          title: "Sus derechos (RGPD)",
          body: "Puede pedir a su anfitrión que elimine sus respuestas en cualquier momento, o escribir al operador a support@renttools.io para cualquier consulta, solicitud de acceso o reclamación de privacidad.",
        },
      ],
      fullPolicyLabel: "Política de privacidad completa de RentTools",
      sourceLinkLabel: "código fuente en GitHub",
    },
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
