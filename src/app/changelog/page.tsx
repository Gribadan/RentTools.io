import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { applySeoOverrides } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/alternates";
import type { Locale } from "@/lib/i18n/translations";
import {
  CHANGELOG,
  type ChangelogChange,
  type ChangelogEntry,
  type ChangelogKind,
} from "@/lib/changelog-entries";

// Public product changelog at /changelog. Single canonical URL; page
// chrome is translated into all 5 app locales but the entries
// themselves stay English-first (the source-of-truth lives in
// src/lib/changelog-entries.ts — see the header comment there for the
// authoring rules).

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

interface CopyShape {
  ogLocale: string;
  breadcrumbNav: string;
  homeLabel: string;
  homeHref: string;
  changelogLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  kindLabels: Record<ChangelogKind, string>;
  emptyState: string;
  footerHome: string;
  footerPrivacy: string;
  footerTerms: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    ogLocale: "en_US",
    breadcrumbNav: "Breadcrumb",
    homeLabel: "Home",
    homeHref: "/",
    changelogLabel: "Changelog",
    heroEyebrow: "What's new",
    heroTitle: "RentTools changelog",
    heroIntro:
      "User-visible changes, grouped by the day they reached production. New capabilities, useful improvements, and the bug fixes that actually mattered — internal refactors and dependency bumps live in the commit log, not here.",
    kindLabels: { added: "Added", improved: "Improved", fixed: "Fixed" },
    emptyState: "No changes recorded yet.",
    footerHome: "Home",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
  },
  ru: {
    ogLocale: "ru_RU",
    breadcrumbNav: "Хлебные крошки",
    homeLabel: "Главная",
    homeHref: "/",
    changelogLabel: "История изменений",
    heroEyebrow: "Что нового",
    heroTitle: "История изменений RentTools",
    heroIntro:
      "Заметные пользователю изменения, сгруппированные по дате выхода. Новые возможности, полезные улучшения и значимые исправления — внутренние рефакторинги и обновления зависимостей живут в git-логе, а не здесь.",
    kindLabels: { added: "Добавлено", improved: "Улучшено", fixed: "Исправлено" },
    emptyState: "Изменений пока нет.",
    footerHome: "Главная",
    footerPrivacy: "Конфиденциальность",
    footerTerms: "Условия",
  },
  de: {
    ogLocale: "de_DE",
    breadcrumbNav: "Brotkrümelnavigation",
    homeLabel: "Startseite",
    homeHref: "/",
    changelogLabel: "Änderungsverlauf",
    heroEyebrow: "Was ist neu",
    heroTitle: "RentTools-Änderungsverlauf",
    heroIntro:
      "Für Nutzer sichtbare Änderungen, gruppiert nach dem Tag, an dem sie live gingen. Neue Funktionen, sinnvolle Verbesserungen und wirklich relevante Fehlerbehebungen — interne Refactorings und Abhängigkeits-Updates bleiben im Commit-Log.",
    kindLabels: { added: "Neu", improved: "Verbessert", fixed: "Behoben" },
    emptyState: "Noch keine Änderungen erfasst.",
    footerHome: "Startseite",
    footerPrivacy: "Datenschutz",
    footerTerms: "Nutzungsbedingungen",
  },
  fr: {
    ogLocale: "fr_FR",
    breadcrumbNav: "Fil d'Ariane",
    homeLabel: "Accueil",
    homeHref: "/",
    changelogLabel: "Journal des modifications",
    heroEyebrow: "Quoi de neuf",
    heroTitle: "Journal des modifications de RentTools",
    heroIntro:
      "Changements visibles par les utilisateurs, regroupés par date de mise en production. Nouvelles fonctionnalités, améliorations utiles et corrections de bugs qui comptent vraiment — les refactorisations internes et les mises à jour de dépendances restent dans l'historique Git.",
    kindLabels: { added: "Ajouté", improved: "Amélioré", fixed: "Corrigé" },
    emptyState: "Aucune modification enregistrée pour le moment.",
    footerHome: "Accueil",
    footerPrivacy: "Confidentialité",
    footerTerms: "Conditions",
  },
  es: {
    ogLocale: "es_ES",
    breadcrumbNav: "Migas de pan",
    homeLabel: "Inicio",
    homeHref: "/",
    changelogLabel: "Registro de cambios",
    heroEyebrow: "Novedades",
    heroTitle: "Registro de cambios de RentTools",
    heroIntro:
      "Cambios visibles para los usuarios, agrupados por el día en que se desplegaron. Nuevas funciones, mejoras útiles y correcciones de errores que sí importaban — los refactores internos y actualizaciones de dependencias viven en el historial de commits, no aquí.",
    kindLabels: { added: "Añadido", improved: "Mejorado", fixed: "Corregido" },
    emptyState: "Aún no hay cambios registrados.",
    footerHome: "Inicio",
    footerPrivacy: "Privacidad",
    footerTerms: "Términos",
  },
};

const KIND_ORDER: ChangelogKind[] = ["added", "improved", "fixed"];

const KIND_STYLES: Record<ChangelogKind, string> = {
  added: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  improved: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  fixed: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = COPY[locale];
  const base: Metadata = {
    title: copy.heroTitle,
    description: copy.heroIntro,
    alternates: { canonical: "/changelog" },
    openGraph: {
      type: "article",
      title: `${copy.heroTitle} · RentTools`,
      description: copy.heroIntro,
      url: `${SITE_URL}/changelog`,
      siteName: "RentTools",
      locale: copy.ogLocale,
    },
    twitter: {
      card: "summary",
      title: `${copy.heroTitle} · RentTools`,
      description: copy.heroIntro,
    },
  };
  return applySeoOverrides(base, "/changelog", locale);
}

export default async function ChangelogPage() {
  const locale = await getLocale();
  const t = COPY[locale];

  return (
    <div className="editorial min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <MarketingHeader sticky />

      <main className="mx-auto max-w-[920px] px-4 sm:px-6">
        <Breadcrumbs
          className="pt-6 sm:pt-8"
          navLabel={t.breadcrumbNav}
          items={[
            { label: t.homeLabel, href: localePath(t.homeHref, locale) },
            { label: t.changelogLabel },
          ]}
        />

        <section className="relative mt-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-2)]/40 px-5 pb-8 pt-8 sm:px-10 sm:pb-12 sm:pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--m-accent) 22%, transparent) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="mono mb-4 inline-block rounded-full bg-[var(--bg-2)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
              {t.heroEyebrow}
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl md:text-[2.75rem]">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-[var(--ink-3)] sm:text-lg">
              {t.heroIntro}
            </p>
          </div>
        </section>

        {CHANGELOG.length === 0 ? (
          <p className="mt-12 text-sm text-[var(--ink-4)]">{t.emptyState}</p>
        ) : (
          <div className="mt-12 space-y-12 pb-16">
            {CHANGELOG.map((entry) => (
              <ChangelogEntryView
                key={entry.date}
                entry={entry}
                kindLabels={t.kindLabels}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[var(--ink-4)] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link
              href={localePath("/", locale)}
              className="hover:text-[var(--ink)]"
            >
              {t.footerHome}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">
              {t.footerPrivacy}
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">
              {t.footerTerms}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function ChangelogEntryView({
  entry,
  kindLabels,
}: {
  entry: ChangelogEntry;
  kindLabels: Record<ChangelogKind, string>;
}) {
  // Group the entry's changes by kind so the renderer can show each
  // section (Added / Improved / Fixed) in a fixed order regardless of
  // how the author wrote them in the source array.
  const grouped: Record<ChangelogKind, ChangelogChange[]> = {
    added: [],
    improved: [],
    fixed: [],
  };
  for (const c of entry.changes) grouped[c.kind].push(c);

  return (
    <article
      id={entry.date}
      className="scroll-mt-24 border-l-2 border-[var(--line)] pl-5 sm:pl-7"
    >
      <header className="-ml-[26px] sm:-ml-[34px]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-[var(--m-accent)] ring-4 ring-[var(--bg)]"
          />
          <a
            href={`#${entry.date}`}
            className="mono text-sm font-semibold tracking-wide text-[var(--ink-2)] hover:text-[var(--ink)]"
          >
            {entry.date}
          </a>
        </div>
        {entry.headline && (
          <h2 className="mt-2 ml-[22px] sm:ml-[30px] text-pretty text-lg font-semibold text-[var(--ink)] sm:text-xl">
            {entry.headline}
          </h2>
        )}
      </header>

      <div className="mt-4 space-y-4">
        {KIND_ORDER.map((kind) => {
          const items = grouped[kind];
          if (items.length === 0) return null;
          return (
            <div key={kind}>
              <span
                className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_STYLES[kind]}`}
              >
                {kindLabels[kind]}
              </span>
              <ul className="mt-2 space-y-1.5">
                {items.map((c, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-[var(--ink-2)] sm:text-[15px]"
                  >
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </article>
  );
}
