"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/lib/session-context";

const REPO_URL = "https://github.com/Gribadan/RentTools.io";

interface MarketingHeaderProps {
  /** Sticky variant for long-content pages (blog post + index). Off by
   *  default so the home page and onboarding wizard match. */
  sticky?: boolean;
  /** Switch language in place (no page reload) instead of hard-
   *  navigating to the locale-prefixed URL. Set on pages whose copy is
   *  entirely client-rendered via t() — the auth screens — so a
   *  language switch keeps in-progress form state (e.g. a half-typed
   *  verification code). Leave off for content pages that need the
   *  server body to re-render in the new locale. */
  softLocaleSwitch?: boolean;
}

const NAV_LABELS = {
  en: { blog: "Blog", signIn: "Sign in", getStarted: "Get started", dashboard: "Dashboard" },
  ru: { blog: "Блог", signIn: "Войти", getStarted: "Начать", dashboard: "Панель" },
  de: { blog: "Blog", signIn: "Anmelden", getStarted: "Loslegen", dashboard: "Dashboard" },
  fr: { blog: "Blog", signIn: "Se connecter", getStarted: "Commencer", dashboard: "Tableau de bord" },
  es: { blog: "Blog", signIn: "Iniciar sesión", getStarted: "Comenzar", dashboard: "Panel" },
};

/**
 * Public-marketing header — used on the home page, /onboard, /blog, and
 * /blog/[slug]. Identical brand mark + nav across all four so a visitor
 * never sees the chrome change while bouncing between them.
 *
 * Brand mark: animated coral pill + house silhouette + three SMIL smoke
 * puffs from the chimney. Same SVG that ships in the home-page header.
 *
 * Nav: Blog · GitHub · Sign in · Get started · ThemeToggle · LocaleSwitcher.
 * GitHub + Get started both hide on <sm to keep the small-screen header
 * to a single readable row.
 */
export function MarketingHeader({ sticky = false, softLocaleSwitch = false }: MarketingHeaderProps) {
  const { locale } = useI18n();
  const session = useSession();
  const t = NAV_LABELS[locale];
  const isAuthenticated = session !== null;
  // Locale-aware href helper — internal links must point at the
  // locale-prefixed URL when the user is in a non-default locale,
  // otherwise the middleware would 308-redirect every click. Prefixing
  // here lets the navigation hit the final URL on the first request.
  // Pages outside LOCALIZABLE_PATHS (e.g. /dashboard) stay unprefixed
  // because the middleware would redirect /<locale>/dashboard back to
  // /dashboard anyway.
  const NON_LOCALIZED_TARGETS = new Set(["/dashboard"]);
  const localized = (href: string): string => {
    if (locale === "en") return href;
    if (NON_LOCALIZED_TARGETS.has(href)) return href;
    if (href === "/") return `/${locale}`;
    return `/${locale}${href}`;
  };
  return (
    <header
      className={
        sticky
          ? "sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md"
          : "border-b border-[var(--line)]"
      }
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <Link
          href={localized("/")}
          aria-label="RentTools home"
          className="group flex shrink-0 items-center gap-2 min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-accent)]/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--m-accent)] shadow-sm shadow-[var(--m-accent)]/30 transition-all duration-200 ease-out group-hover:scale-110 group-hover:shadow-md group-hover:shadow-[var(--m-accent)]/50 group-active:scale-90 group-active:duration-75">
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
              <g fill="white" stroke="white" strokeWidth="0.4" strokeLinejoin="round">
                <path d="M3.4 11.6 L12 4.5 L20.6 11.6 L19 11.6 L19 19.5 L5 19.5 L5 11.6 Z" />
                <rect x="15.6" y="6.2" width="1.7" height="3.4" rx="0.2" />
              </g>
              <g fill="var(--m-accent)">
                <rect x="10.6" y="14" width="2.8" height="5.5" rx="0.4" />
                <rect x="6.7" y="13" width="2.4" height="2.4" rx="0.3" />
                <rect x="14.9" y="13" width="2.4" height="2.4" rx="0.3" />
              </g>
              <g fill="white">
                <circle cx="16.45" cy="5.5" r="0.6" opacity="0">
                  <animate attributeName="cy" values="5.5;3.2;1" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="cx" values="16.45;16.7;17.1" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="r" values="0.4;0.7;0.9" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0.85;0" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="16.45" cy="5.5" r="0.6" opacity="0">
                  <animate attributeName="cy" values="5.5;3.2;1" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="cx" values="16.45;16.2;15.9" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="r" values="0.4;0.7;0.9" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0.7;0" dur="3s" begin="1s" repeatCount="indefinite" />
                </circle>
                <circle cx="16.45" cy="5.5" r="0.6" opacity="0">
                  <animate attributeName="cy" values="5.5;3.2;1" dur="3s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="cx" values="16.45;16.6;17" dur="3s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="r" values="0.4;0.7;0.9" dur="3s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0.6;0" dur="3s" begin="2s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>
          </div>
          <span className="display text-[17px] font-semibold tracking-tight text-[var(--ink)]">
            RentTools
          </span>
        </Link>

        {/* Right cluster — uses shrink-0 + whitespace-nowrap on every
            child so the auth labels never wrap onto a second line at
            ~375px (previously "Sign in" wrapped to two lines because
            the cluster ran out of space). The Blog link is hidden on
            the smallest viewports — the brand mark + the primary CTA
            + the chrome (theme/locale) win precedence over a
            discoverable nav link the user can still reach via the
            footer or the dashboard side panel. */}
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Link
            href={localized("/blog")}
            className="hidden whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)] sm:inline-flex sm:px-3"
          >
            {t.blog}
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)] sm:inline-flex"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
            GitHub
          </a>
          {isAuthenticated ? (
            // Already signed in — collapse Sign in + Get started into a
            // single Dashboard button. Anything else is the wrong call:
            // showing Sign in to a signed-in user is confusing, and a
            // separate Sign out belongs in the dashboard chrome (where
            // the user is when they want to leave), not in marketing
            // header that they hit while exploring blog/onboard pages.
            <Link
              href={localized("/dashboard")}
              className="whitespace-nowrap rounded-md bg-[var(--ink)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--bg)] transition-colors hover:bg-[var(--ink-2)] sm:px-3"
            >
              {t.dashboard}
            </Link>
          ) : (
            <>
              <Link
                href={localized("/login")}
                className="whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)] sm:px-3"
              >
                {t.signIn}
              </Link>
              <Link
                href={localized("/onboard")}
                className="hidden whitespace-nowrap rounded-md bg-[var(--ink)] px-3 py-1.5 text-[13px] font-medium text-[var(--bg)] transition-colors hover:bg-[var(--ink-2)] sm:inline-flex"
              >
                {t.getStarted}
              </Link>
            </>
          )}
          {/* Divider hidden on mobile — every pixel matters and the
              auth pill / locale switcher already provide visual
              separation via their own borders. */}
          <span className="mx-1 hidden h-4 w-px bg-[var(--line)] sm:block" />
          <ThemeToggle />
          <LocaleSwitcher reloadOnChange={!softLocaleSwitch} />
        </nav>
      </div>
    </header>
  );
}
