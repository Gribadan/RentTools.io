import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/site-settings";
import { applySeoOverrides } from "@/lib/seo";
import { localePath } from "@/lib/i18n/alternates";
import { GoogleOneTap } from "@/components/google-one-tap";
import { JsonLd } from "@/components/json-ld";
import { MarketingHeader } from "@/components/marketing-header";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/translations";

// Per-path SEO override hook (RT-18.3). The root layout already supplies
// title / description / OG / canonical defaults; this lets a super-admin
// swap any of those for "/" specifically without redeploying.
//
// hreflang + per-language canonical is wired via `localizedAlternates`
// so Google indexes each language version separately and ranks each
// in its own market. The page lives at the same file regardless of
// locale — middleware rewrites /ru/ to / internally — so the canonical
// is built from the resolved locale, not the file path.
//
// Per-locale title + description + OG locale are set here too. Without
// them, the root layout's English defaults would leak through onto
// /ru/, giving Google a `<title>` and `og:description` that say one
// thing and a `<html lang="ru">` body that says another — exactly the
// signal mismatch that drops a page out of the Russian SERP.
const HOME_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title:
      "RentTools — open-source property manager for short-term rentals",
    description:
      "Free open-source property manager for short-term rental hosts. Sync Airbnb + Booking.com calendars, automate cleaning, extract guest passports.",
  },
  ru: {
    title:
      "RentTools — открытый менеджер краткосрочной аренды",
    description:
      "Бесплатный менеджер для хостов краткосрочной аренды с открытым кодом. Синхронизация календарей Airbnb и Booking.com, автоматизация уборок, распознавание паспортов гостей.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const { localizedAlternates, SUPPORTED_LOCALES } = await import("@/lib/i18n/alternates");
  const locale = await getLocale();
  const alts = localizedAlternates("/", locale);
  const meta = HOME_META[locale];
  // OG `alternateLocale` declares the hreflang siblings inside the
  // OpenGraph block too — Facebook / LinkedIn use it the same way
  // Google uses `<link rel="alternate" hreflang>`.
  const alternateLocale = SUPPORTED_LOCALES
    .filter((l) => l !== locale)
    .map((l) => (l === "ru" ? "ru_RU" : "en_US"));
  const ogLocale = locale === "ru" ? "ru_RU" : "en_US";
  return applySeoOverrides<Metadata>(
    {
      title: meta.title,
      description: meta.description,
      alternates: alts,
      openGraph: {
        type: "website",
        title: meta.title,
        description: meta.description,
        url: alts.canonical,
        siteName: "RentTools",
        locale: ogLocale,
        alternateLocale,
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
      },
    },
    "/",
    locale,
  );
}

const REPO_URL = "https://github.com/Gribadan/RentTools.io";

interface SectionStep { title: string; body: string }
interface SectionFeature { title: string; body: string }
interface SectionFaq { q: string; a: string }
interface CopyBlock {
  hero: { eyebrow: string; titleLead: string; titleAccent: string; subtitleA: string; platforms: string; subtitleB: string; subtitleC: string; subtitleD: string; cta: string; ctaNote: string };
  how: { eyebrow: string; title: string; steps: SectionStep[]; tryWizard: string };
  features: { eyebrow: string; titleA: string; titleB: string; items: SectionFeature[] };
  compatible: { label: string; footer: string };
  trust: { open: { title: string; body: string; link: string }; gdpr: { title: string; body: string; link: string } };
  faq: { eyebrow: string; title: string; items: SectionFaq[] };
  finalCta: { titleA: string; titleB: string; body: string; primary: string; secondary: string };
  footer: { copyright: string; github: string; blog: string; terms: string; privacy: string; signIn: string; cookieNoteA: string; cookieNoteLink: string; cookieNoteB: string };
}

// All marketing copy split EN/RU. The EN block also seeds the FAQPage +
// SoftwareApplication JSON-LD so the structured data Google sees stays
// in English (international SEO signal). The RU block drives only the
// visible page render when the rt-locale cookie is "ru".
const COPY: Record<Locale, CopyBlock> = {
  en: {
    hero: {
      eyebrow: "Open source · Forever free",
      titleLead: "Stop juggling",
      titleAccent: "calendar tabs",
      subtitleA: "Cross-sync calendars across",
      platforms: "Airbnb, Booking.com, Vrbo",
      subtitleB: "and any iCal source so each platform sees the others' bookings —",
      subtitleC: "drastically fewer double-booking surprises",
      subtitleD: ". Forever free, open-source.",
      cta: "Start now — forever free",
      ctaNote: "No credit card. No paid tier. Try the wizard before signing up.",
    },
    how: {
      eyebrow: "How it works",
      title: "Three steps. Most hosts finish in seven minutes.",
      steps: [
        {
          title: "Paste your platform iCal URLs",
          body: "Airbnb has one in Calendar → Sync calendars → Export. Booking.com has one in Calendar → Sync calendars. Vrbo too. Drop them in our wizard.",
        },
        {
          title: "We hand you back a unified feed",
          body: "One iCal URL per platform that includes everyone else's bookings plus your manual entries plus cleaning buffer days. No double bookings.",
        },
        {
          title: "Paste our URL back into each platform",
          body: "Airbnb and Booking.com pull our feed every few hours. Now their calendars know about each other and about your manual blocks.",
        },
      ],
      tryWizard: "Try the wizard without signing up",
    },
    features: {
      eyebrow: "Built for the parts that hurt",
      titleA: "Everything a host needs.",
      titleB: "Nothing you'll never use.",
      items: [
        {
          title: "Cross-platform calendar sync",
          body: "Every 10 minutes we pull each platform's iCal feed and republish it for the others. Airbnb sees Booking's bookings and vice versa — the same protection paid channel managers offer, just free and open-source.",
        },
        {
          title: "Cleaning automation",
          body: "Buffer days the platforms can't do natively. Daily cleaning list. Cleaner role with restricted dashboard access.",
        },
        {
          title: "Multi-property dashboard",
          body: "Run as many places as you want from one panel. Switch context with a keystroke. Property managers + cleaners get scoped roles.",
        },
        {
          title: "Message templates",
          body: "Per-property templates with variables (guest name, check-in, wifi). Copy to clipboard, paste into Airbnb / WhatsApp.",
        },
        {
          title: "Public iCal feed",
          body: "Every property has its own feed URL. Paste it back into Airbnb / Booking and let them pull your manual blocks.",
        },
        {
          title: "Cmd-K guest search",
          body: "Find any past guest across every property in one keystroke. With document export when you need to file paperwork.",
        },
      ],
    },
    compatible: {
      label: "Compatible with",
      footer: "…and any platform that exports an iCal feed.",
    },
    trust: {
      open: {
        title: "Open source",
        body: "MIT-licensed on GitHub. Read the code, file an issue, or self-host on any $4 droplet.",
        link: "View on GitHub",
      },
      gdpr: {
        title: "GDPR compliant",
        body: "One essential session cookie. No analytics, no ads, no third-party trackers. Delete your account, your data is gone.",
        link: "Privacy policy",
      },
    },
    faq: {
      eyebrow: "Quick answers",
      title: "The questions hosts ask first.",
      items: [
        {
          q: "Does this actually prevent double-bookings?",
          a: "It cuts the risk dramatically — not to zero, but close. We pull each platform's iCal feed every 10 minutes and republish it for the others, so Airbnb learns about Booking.com bookings (and vice versa) within ~10 min on our side. The platforms refresh imported feeds every 2-12h on their side. Real-time API sync would be faster, but Airbnb / Booking.com don't sell their channel-manager APIs to individual hosts — only to certified PMS providers who charge $100-300/mo to forward the same feeds we sync for free. For 99% of small hosts, the iCal handshake is more than enough.",
        },
        {
          q: "Is it really free?",
          a: "Yes. The hosted instance is free for personal use, rate-limited per account so the bills stay sane. The source is MIT — clone it, run it on a $4 droplet, you owe nothing.",
        },
        {
          q: "What does it actually do?",
          a: "Pulls any iCal-compatible calendar — Airbnb, Booking.com, Vrbo, or anything else that exposes an export URL — so you stop juggling tabs. Adds buffer days for cleaning that the platforms can't do natively. Generates a daily cleaning list. Per-property message templates and Cmd-K guest search across every property you own.",
        },
        {
          q: "Do I have to host my own?",
          a: "No. Sign up here and use the hosted version. If one day you outgrow the free tier or want full data ownership, export and self-host — your data, your call.",
        },
        {
          q: "Where does my guest data live?",
          a: "On a single SQLite file inside the hosted server. No third-party processors except Google Gemini for passport OCR (and only for that one request). Delete your account and the data is gone.",
        },
      ],
    },
    finalCta: {
      titleA: "Built by a host.",
      titleB: "For hosts.",
      body: "No paid tier. No upsell. No tracking. The maintainer pays the hosting bill so you can focus on guests instead of calendar tabs.",
      primary: "Start now — forever free",
      secondary: "Read the source",
    },
    footer: {
      copyright: "© 2026 RentTools · MIT License",
      github: "GitHub",
      blog: "Blog",
      terms: "Terms",
      privacy: "Privacy",
      signIn: "Sign in",
      cookieNoteA: "Essential cookies only — no tracking, no analytics. See ",
      cookieNoteLink: "Privacy",
      cookieNoteB: ".",
    },
  },
  ru: {
    hero: {
      eyebrow: "Открытый код · Бесплатно навсегда",
      titleLead: "Хватит метаться между",
      titleAccent: "календарями",
      // Drops the awkward "Соединяем календари в Airbnb..." (reads as "inside
      // Airbnb"). New flow: "Synchronize calendars between Airbnb, Booking,
      // Vrbo and anything else with iCal." Same word count, native preposition.
      subtitleA: "Синхронизируем календари между",
      platforms: "Airbnb, Booking.com, Vrbo",
      subtitleB: "и всем, что отдаёт iCal. Каждая платформа видит чужие брони —",
      subtitleC: "двойные бронирования почти исчезают",
      subtitleD: ". Бесплатно навсегда, с открытым кодом.",
      cta: "Начать — бесплатно навсегда",
      ctaNote: "Без карты. Без платных тарифов. Сначала пробуете — потом регистрируетесь.",
    },
    how: {
      eyebrow: "Как это работает",
      title: "Три шага. У большинства уходит семь минут.",
      steps: [
        {
          title: "Скопируйте iCal-ссылки с каждой платформы",
          body: "У Airbnb это в Calendar → Sync calendars → Export. У Booking.com — Calendar → Sync calendars. У Vrbo тоже есть. Вставьте ссылки в форму.",
        },
        {
          title: "Получите единый фид для каждой платформы",
          body: "По одному iCal-URL на платформу: туда уже зашиты чужие брони, ваши ручные записи и буферные дни на уборку. Двойным бронированиям просто негде взяться.",
        },
        {
          title: "Вставьте нашу ссылку обратно — в каждую",
          body: "Airbnb и Booking.com подтянут наш фид через несколько часов. С этого момента их календари знают друг о друге и о ваших ручных блокировках.",
        },
      ],
      tryWizard: "Попробовать без регистрации",
    },
    features: {
      eyebrow: "Сделано под боль, а не под презентацию",
      titleA: "Всё, что нужно хосту.",
      titleB: "Ничего лишнего.",
      items: [
        {
          title: "Связь между платформами",
          body: "Раз в 10 минут забираем iCal каждой платформы и публикуем его для остальных. Airbnb видит брони Booking и наоборот — та же защита, что даёт платный channel manager, только бесплатно и с открытым кодом.",
        },
        {
          title: "Автоматизация уборок",
          body: "Буферные дни, которых сами платформы не умеют. Список уборок на день. Отдельная роль уборщика — со своим доступом, без лишнего.",
        },
        {
          title: "Несколько объектов — одна панель",
          body: "Управляйте сколько угодно объектами из одной точки. Переключение горячей клавишей. У соведущих и уборщиков — свои роли с нужным доступом.",
        },
        {
          title: "Шаблоны сообщений",
          body: "Шаблоны под каждый объект с подстановкой (имя гостя, заезд, wifi). В один клик — и сразу в Airbnb или WhatsApp.",
        },
        {
          title: "Публичный iCal-фид",
          body: "У каждого объекта свой URL. Вставьте его в Airbnb или Booking — и они подхватят ваши ручные блокировки.",
        },
        {
          title: "Поиск гостей по Cmd-K",
          body: "Любой прошлый гость по всем объектам — за одну горячую клавишу. С экспортом документов, когда нужно сдать отчётность или подать в МВД.",
        },
      ],
    },
    compatible: {
      label: "Работает с",
      footer: "…и с любой платформой с iCal-экспортом.",
    },
    trust: {
      open: {
        title: "Открытый код",
        body: "Лицензия MIT на GitHub. Читайте код, открывайте issue, поднимайте у себя на любом $4 дроплете.",
        link: "Посмотреть на GitHub",
      },
      gdpr: {
        title: "Соответствует GDPR",
        body: "Одна служебная cookie сессии. Без аналитики, без рекламы, без сторонних трекеров. Удалили аккаунт — данные пропали вместе с ним.",
        link: "Политика конфиденциальности",
      },
    },
    faq: {
      eyebrow: "Что спрашивают первым",
      title: "Главные вопросы хостов.",
      items: [
        {
          q: "Это действительно защищает от двойных бронирований?",
          a: "Снижает риск драматически — не до нуля, но близко. iCal каждой платформы мы забираем раз в 10 минут и публикуем для остальных, так что Airbnb узнаёт о броне на Booking (и наоборот) примерно за те же 10 минут. Сами платформы обновляют импортированные фиды у себя раз в 2–12 часов. API в реальном времени было бы быстрее, но Airbnb и Booking.com не продают свои channel-manager API частным хостам — только сертифицированным PMS, и те берут $100–300 в месяц за то же самое. Для 99% небольших хостов обмена через iCal хватает с запасом.",
        },
        {
          q: "И это правда бесплатно?",
          a: "Да. Наша размещённая версия бесплатна для личного использования, с лимитом запросов на аккаунт — чтобы наши счета за хостинг не разрослись. Исходники под MIT: клонируйте, запустите на $4 дроплете — и никому ничего не должны.",
        },
        {
          q: "Что он на самом деле делает?",
          a: "Забирает любой iCal-совместимый календарь — Airbnb, Booking.com, Vrbo и всё остальное, что отдаёт URL экспорта, — чтобы вы перестали скакать по вкладкам. Добавляет буферные дни на уборку, которых нет у платформ. Каждое утро собирает список уборок. Плюс шаблоны сообщений с привязкой к объекту и поиск гостей по Cmd-K — сразу по всем объектам.",
        },
        {
          q: "Обязательно поднимать у себя?",
          a: "Нет. Зарегистрируйтесь и пользуйтесь нашей версией. Если когда-нибудь перерастёте бесплатный лимит или захотите полный контроль над данными — экспортируете и поднимаете у себя. Ваш выбор.",
        },
        {
          q: "Где живут данные гостей?",
          a: "В одном SQLite-файле на нашем сервере. Никаких сторонних обработчиков — кроме Google Gemini, и то только на одну операцию: распознавание паспорта. Удалите аккаунт — данных не останется.",
        },
      ],
    },
    finalCta: {
      titleA: "Сделано хостом.",
      titleB: "Для хостов.",
      body: "Без платных тарифов. Без допродаж. Без трекинга. Хостинг оплачиваем сами, чтобы вы занимались гостями, а не вкладками браузера.",
      primary: "Начать — бесплатно навсегда",
      secondary: "Посмотреть исходники",
    },
    footer: {
      copyright: "© 2026 RentTools · MIT License",
      github: "GitHub",
      blog: "Блог",
      terms: "Условия",
      privacy: "Конфиденциальность",
      signIn: "Войти",
      cookieNoteA: "Только служебные cookie — без трекинга и аналитики. Подробнее в ",
      cookieNoteLink: "Политике конфиденциальности",
      cookieNoteB: ".",
    },
  },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: COPY.en.faq.items.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

// SoftwareApplication schema — describes the *product* RentTools is.
// Distinct from the Organization block in the root layout (which
// describes the *publisher*). Required-by-Google fields: name, applicationCategory,
// operatingSystem, offers. The price=0 + priceCurrency=USD pair is what makes
// the "Free" badge appear in the rich result.
const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "RentTools",
  description:
    "Free open-source property management software for short-term rental hosts. Cross-syncs Airbnb, Booking.com, and Vrbo iCal calendars; automates cleaning schedules; manages multi-property guest data.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Linux (self-host)",
  url: SITE_URL,
  softwareVersion: "1.0",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  publisher: { "@id": `${SITE_URL}/#organization` },
  featureList: [
    "Cross-platform iCal calendar sync",
    "Cleaning schedule automation",
    "Multi-property dashboard",
    "Guest passport extraction",
    "Per-property message templates",
    "Cmd-K guest search",
    "GDPR-compliant data export and deletion",
  ],
};

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const supportEmail = (await getSetting("support_email", "")).trim();
  const locale = await getLocale();
  const t = COPY[locale];

  return (
    <div className="editorial min-h-screen flex flex-col">
      <JsonLd data={FAQ_LD} />
      <JsonLd data={SOFTWARE_LD} />
      <GoogleOneTap />

      <MarketingHeader />

      {/* ─────────────── Hero ─────────────── */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 pointer-events-none opacity-60" aria-hidden="true" />
        <div className="calendar-pills absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1180px] px-6 pt-16 pb-16 text-center sm:pt-20 sm:pb-20">
          <p className="hero-in mono mb-5 inline-block rounded-full bg-[var(--bg-2)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            {t.hero.eyebrow}
          </p>
          <h1 className="hero-in hero-in-2 display mx-auto max-w-[820px] text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink)] sm:text-[52px] lg:text-[60px]">
            {t.hero.titleLead}{" "}
            <span className="relative whitespace-nowrap">
              <span className="italic font-normal">{t.hero.titleAccent}</span>
              <svg
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5"
                width="100%"
                height="10"
                viewBox="0 0 220 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="underline-draw"
                  d="M2 6 Q 55 1, 110 5 T 218 5"
                  fill="none"
                  stroke="var(--m-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>
          <p className="hero-in hero-in-3 mx-auto mt-6 max-w-[620px] text-[16px] leading-[1.55] text-[var(--ink-2)] sm:text-[18px]">
            {t.hero.subtitleA}{" "}
            <span className="text-[var(--ink)] font-medium">{t.hero.platforms}</span>{" "}
            {t.hero.subtitleB}{" "}
            <span className="text-[var(--ink)] font-medium">{t.hero.subtitleC}</span>
            {t.hero.subtitleD}
          </p>

          <div className="hero-in hero-in-4 mt-8 flex justify-center">
            <Link
              href={localePath("/onboard", locale)}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--m-accent)] px-8 text-[14px] font-medium text-white transition-all hover:bg-[var(--m-accent-2)] hover:translate-y-[-1px] active:translate-y-0 shadow-[0_2px_8px_rgba(255,56,92,0.25)] sm:w-auto"
            >
              {t.hero.cta}
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <p className="hero-in hero-in-4 mt-4 text-[12.5px] text-[var(--ink-3)]">
            {t.hero.ctaNote}
          </p>
        </div>
      </section>

      {/* ─────────────── How it works ─────────────── */}
      <section id="how-it-works" className="border-t border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">{t.how.eyebrow}</p>
            <h2 className="display-tight mt-3 text-[32px] font-semibold tracking-tight text-[var(--ink)] sm:text-[42px]">
              {t.how.title}
            </h2>
          </div>
          <ol className="mt-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {t.how.steps.map((s, i) => (
              <Step key={i} n={`0${i + 1}`} title={s.title} body={s.body} />
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Link
              href={localePath("/onboard", locale)}
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--m-accent)] hover:underline"
            >
              {t.how.tryWizard}
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────── Features ─────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">{t.features.eyebrow}</p>
            <h2 className="display-tight mt-3 text-[32px] font-semibold tracking-tight text-[var(--ink)] sm:text-[42px]">
              {t.features.titleA}<br className="hidden sm:inline" /> {t.features.titleB}
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((f, i) => (
              <Feature key={i} title={f.title} body={f.body} />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── Compatible with strip ─────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1180px] px-6 py-12 sm:py-16">
          <p className="mono text-center text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            {t.compatible.label}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
            {[
              { name: "Airbnb", color: "#ff385c" },
              { name: "Booking.com", color: "#003580" },
              { name: "Vrbo", color: "#245abc" },
              { name: "Expedia", color: "#c69a14" },
              { name: "Hostaway", color: "#2e5bff" },
              { name: "Lodgify", color: "#00928a" },
              { name: "Smoobu", color: "#5b1a98" },
              { name: "Plum Guide", color: "#2e1065" },
            ].map((p) => (
              <PlatformChip key={p.name} name={p.name} color={p.color} />
            ))}
          </div>
          <p className="mt-6 text-center text-[12.5px] text-[var(--ink-3)]">
            {t.compatible.footer}
          </p>
        </div>
      </section>

      {/* ─────────────── Trust ─────────────── */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
            <Trust
              title={t.trust.open.title}
              body={t.trust.open.body}
              link={{ href: REPO_URL, label: t.trust.open.link, external: true }}
            />
            <Trust
              title={t.trust.gdpr.title}
              body={t.trust.gdpr.body}
              link={{ href: "/privacy", label: t.trust.gdpr.link }}
            />
          </div>
        </div>
      </section>

      {/* ─────────────── FAQ ─────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[760px] px-6 py-20 sm:py-24">
          <div className="text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">{t.faq.eyebrow}</p>
            <h2 className="display-tight mt-3 text-[32px] font-semibold tracking-tight text-[var(--ink)] sm:text-[40px]">
              {t.faq.title}
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {t.faq.items.map((f) => (
              <Faq key={f.q} q={f.q}>
                {f.a}
              </Faq>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── Final CTA ─────────────── */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-[680px] text-center">
            <h2 className="display text-[36px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[52px]">
              {t.finalCta.titleA} <span className="italic font-normal">{t.finalCta.titleB}</span>
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-[var(--ink-2)]">
              {t.finalCta.body}
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={localePath("/onboard", locale)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--m-accent)] px-7 text-[14px] font-medium text-white transition-all hover:bg-[var(--m-accent-2)] hover:translate-y-[-1px] active:translate-y-0 shadow-[0_2px_8px_rgba(255,56,92,0.25)] sm:w-auto"
              >
                {t.finalCta.primary}
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-6 text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)] sm:w-auto"
              >
                {t.finalCta.secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Footer ─────────────── */}
      <footer className="mt-auto border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1180px] px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 text-[12.5px] text-[var(--ink-3)] sm:flex-row">
            <p>{t.footer.copyright}</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)] transition-colors">{t.footer.github}</a>
              <Link href={localePath("/blog", locale)} className="hover:text-[var(--ink)] transition-colors">{t.footer.blog}</Link>
              <Link href="/terms" className="hover:text-[var(--ink)] transition-colors">{t.footer.terms}</Link>
              <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">{t.footer.privacy}</Link>
              {supportEmail && (
                <a href={`mailto:${supportEmail}`} className="hover:text-[var(--ink)] transition-colors">
                  {supportEmail}
                </a>
              )}
              <Link href={localePath("/login", locale)} className="hover:text-[var(--ink)] transition-colors">{t.footer.signIn}</Link>
            </nav>
          </div>
          <p className="mt-3 text-center text-[11px] text-[var(--ink-4)] sm:text-left">
            {t.footer.cookieNoteA}<Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--ink-3)]">{t.footer.cookieNoteLink}</Link>{t.footer.cookieNoteB}
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="relative rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6 transition-colors hover:border-[var(--line-2)]">
      <span className="mono absolute -top-3 left-6 inline-block rounded-md bg-[var(--ink)] px-2 py-0.5 text-[11px] font-medium text-[var(--bg)]">
        {n}
      </span>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{body}</p>
    </li>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6 transition-all hover:border-[var(--line-2)] hover:translate-y-[-2px]">
      <h3 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-2)]">{body}</p>
    </div>
  );
}

function Trust({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link?: { href: string; label: string; external?: boolean };
}) {
  return (
    <div>
      <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-2)]">{body}</p>
      {link && (
        link.external ? (
          <a href={link.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--m-accent)] hover:underline">
            {link.label}
            <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : (
          <Link href={link.href} className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--m-accent)] hover:underline">
            {link.label}
            <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )
      )}
    </div>
  );
}

function PlatformChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors"
      style={{
        color,
        borderColor: `${color}33`,
        backgroundColor: `${color}0d`,
      }}
    >
      {name}
    </span>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-[var(--line)] bg-[var(--bg)] open:border-[var(--line-2)] transition-colors">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-medium text-[var(--ink)] [&::-webkit-details-marker]:hidden">
        {q}
        <svg className="h-4 w-4 text-[var(--ink-3)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="border-t border-[var(--line)] px-5 py-4 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
        {children}
      </div>
    </details>
  );
}
