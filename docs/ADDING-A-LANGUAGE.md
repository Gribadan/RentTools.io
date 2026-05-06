# Adding a new language to RentTools

Step-by-step playbook for taking RentTools from N languages to N+1. Walks through the code edits, the content edits, and the verification gates that prove Google sees the new locale as a first-class citizen rather than a duplicate of an existing one.

Read this end-to-end before touching code. The order matters — landing the routing edits before the copy means the new URLs serve a 404, landing the copy before the routing means crawlers index untranslated EN content under the new prefix.

---

## Mental model: how locales work on this site

RentTools uses **subdirectory routing with internal rewrite**. Each non-default locale gets its own URL prefix:

- Default locale (`en`) → `/`, `/blog/<slug>`, `/onboard`, …
- Each other locale → `/<locale>/`, `/<locale>/blog/<slug>`, `/<locale>/onboard`, …

The page files live at their default-locale paths (one file per page, not one per locale). The middleware in `src/middleware.ts` detects a `/<locale>/` prefix, strips it, and **rewrites internally** to the bare path while attaching two request headers:

- `x-locale` — the resolved locale (from URL prefix → cookie → default)
- `x-pathname` — the user-visible URL path with the prefix intact, so `generateMetadata` can build canonical/hreflang URLs that match the address bar

Server components read `x-locale` via `getLocale()` from `src/lib/i18n/server.ts`. Client components read it from `I18nProvider` (which is bootstrapped from `getLocale()` on the server, so the first paint already has the right language). Adding a language means: append the locale code to a constants array, add per-locale copy blocks, and (optionally) translate the blog post library.

---

## What the locale system covers automatically

Once you add the locale code to the constants and ship copy, these surfaces light up for free:

- **URL routing** — `/<locale>/...` serves the localized page; `/<locale>/<non-localized-path>` redirects back to the bare path.
- **Sitemap** — `app/sitemap.ts` emits one entry per locale × per static path with `<xhtml:link rel="alternate" hreflang="…">` siblings. Blog posts auto-emit one entry per locale that has a published row in the DB.
- **hreflang on every page** — `localizedAlternates()` in `src/lib/i18n/alternates.ts` builds the `Metadata.alternates.languages` map that Next.js renders as `<link rel="alternate" hreflang="…">` head tags.
- **Self-canonical per language** — each language version's `<link rel="canonical">` points at its own URL, not at the default-locale URL.
- **`<html lang="…">`** — root layout reads `getLocale()` so the lang attribute matches the URL.
- **OG/Twitter locale** — every page sets `openGraph.locale` and (where it matters) `alternateLocale` siblings.
- **Locale switcher** — the `<LocaleSwitcher>` dropdown shows the new flag + label and navigates to the corresponding URL on click.
- **Blog post 404 isolation** — `/<locale>/blog/<en-only-slug>` returns 404 instead of rendering EN under a non-EN URL (which Google would consolidate as duplicate content).
- **Blog tag pages** — stay default-locale-only until the post library in the new locale crosses the indexability threshold.

What the locale system does **not** auto-do — and what you must do by hand:

- Translate the marketing copy (home page sections, onboard wizard strings, blog index chrome, locale switcher labels). The keys are typed in `Record<Locale, ...>` blocks; TypeScript will yell at you for any locale that doesn't have a value.
- Translate the blog post library. Posts are stored per-locale in the DB. New locale = new translations to write.
- Add the legal pages (`/privacy`, `/terms`) — these are deliberately default-locale-only until you have legal-reviewed translations. Do **not** auto-translate legal copy.
- Update the locale switcher's flag SVG (one inline `<svg>` per locale).
- Add the locale's font subset to `next/font` if Latin coverage is insufficient.

---

## Step 1 — Decide

Before you write any code:

1. **Market sizing.** If <5% of expected traffic is in the new language and you don't have a native reviewer, consider not shipping it at all. Bad localization hurts conversion more than missing localization. The user will switch to English if they have to; bad output makes them close the tab.
2. **Native reviewer secured.** Either you read the language fluently, the maintainer does, or you've paid for one round of review. Without this, you ship literal-translation tells (calques, anglicisms, wrong tense, dropped sentence rhythm).
3. **Legal review on `/privacy` + `/terms`.** Decide upfront — translate (lawyer-reviewed) or stay EN-only with a banner. Do not skip this decision.
4. **Translation budget.** Marketing copy = ~70 strings. Onboard wizard = ~30 strings. Blog post library at the time of launch = ~N posts × 1500–2500 words each. Multiply by your hourly translator rate.

If any of those are "no" or "unsure," stop. Work through them before the next step.

---

## Step 2 — Add the locale to the constants

The locale set is duplicated in three places (deliberately — middleware runs in Edge runtime where module imports are fragile, the alternates module is server-only, the locale switcher is client-only). Update all three:

### 2a. `src/middleware.ts`

```ts
const SUPPORTED_LOCALES = ["en", "ru", "<new-locale>"] as const;
```

The middleware already filters out the default locale automatically. No other middleware change is needed unless your new locale uses a non-Latin URL (very unusual — keep the prefix in ASCII).

### 2b. `src/lib/i18n/alternates.ts`

```ts
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "ru", "<new-locale>"];
```

This is the single source of truth for sitemap + per-page metadata. Once it's updated, `localizedAlternates()` and the sitemap emission code automatically include the new locale in every hreflang map.

### 2c. `src/lib/i18n/translations.ts`

```ts
export type Locale = "en" | "ru" | "<new-locale>";
```

This change makes TypeScript flag every `Record<Locale, ...>` block in the codebase that's missing the new key — exactly what you want, because each one is a marketing surface that needs translated copy.

### 2d. `src/components/locale-switcher.tsx`

Add an inline SVG flag component for the new locale (copy the pattern from `FlagRU` / `FlagGB`), update the `FlagFor` switch, append an `OPTIONS` entry with the locale code, short label (e.g., `"DE"`), and full label (e.g., `"Deutsch"`), and append the locale code to `LOCALE_PREFIXES_CLIENT`.

Why an inline SVG and not a flag emoji: Windows desktop browsers render regional indicator characters as plain letters (`🇬🇧` shows as `GB`) because Windows doesn't ship a flag-capable emoji font. SVGs sidestep the OS font fallback entirely.

---

## Step 3 — Run the typechecker; fix every error

```bash
npx tsc --noEmit
```

The new `Locale` value will surface every place the codebase has a `Record<Locale, ...>` block that's missing the new key. Each error is a piece of copy you need to translate. Work through them in this order (highest leverage first):

1. **`src/app/page.tsx`** — `COPY` block (home page hero, features, FAQ, footer). Largest single block. Read `.routines/TRANSLATION-BRIEF.md` first.
2. **`src/app/onboard/page.tsx`** — onboard wizard inline strings (most use `locale === "ru" ? ... : ...` ternaries; convert to a `Record<Locale, ...>` lookup or extend the ternary).
3. **`src/components/marketing-header.tsx`** — `NAV_COPY` (Blog / Sign in / Get started).
4. **`src/app/blog/page.tsx`** — `BLOG_INDEX_COPY` + inline locale ternaries for hero, tag filter, pagination chrome.
5. **`src/app/blog/[slug]/page.tsx`** — any user-visible chrome around the post body.
6. **`src/app/onboard/layout.tsx`, `src/app/login/layout.tsx`, `src/app/signup/layout.tsx`, `src/app/blog/page.tsx`** — `<PAGE>_COPY` for `generateMetadata`.
7. **`src/app/page.tsx`** — `HOME_META` (page title + description shown in browser tab and Google SERP).
8. **`src/components/dashboard-onboarding.tsx`** — dashboard new-user wizard. Lower priority because it's behind login.
9. **Other dashboard surfaces** flagged by typecheck. Translate cleanly (UI labels), no transcreation needed.

For each block, follow the Translation Brief (`.routines/TRANSLATION-BRIEF.md`):

- Brand voice match. Confident, specific, slightly opinionated. No corporate brochure.
- Native idioms over literal calques.
- Niche-natural terms over anglicisms (RU host = "хост", not "владелец недвижимости" or "арендодатель"; that's the niche term every Russian-speaking host uses).
- Glossary: brand names + iCal stay English. Most everything else translates.
- Read each finished block aloud. If you stumble, the reader will too.

---

## Step 4 — Translate the blog post library

For each post in `content/blog/<slug>.md`, create `content/blog/<slug>.<locale>.md` with:

- Same `slug:` value (the URL is `/<locale>/blog/<slug>` — slug stays in the default-locale form so cross-locale link equity isn't split)
- New `locale:` value
- Translated `title:` and `excerpt:`
- Same `tags:` slugs (the slugs stay default-locale; only the `displayName` translates per locale via the seed script's tag upsert)
- Same `ogImageUrl: /blog-covers/<slug>.webp` (cover images are shared across locales)
- Translated body, TL;DR, FAQ — apply the Translation Brief, do the read-aloud test, rewrite at least 30% of any LLM-drafted sentences

The seed script (`prisma/seed-blog-posts.ts`) reads every `.md` file in `content/blog/` and upserts on `(slug, locale)`. EN files and translated files live side-by-side; the filename convention `<slug>.<locale>.md` is for human navigation, not for routing.

If you launch the locale with only some posts translated, that's fine. The sitemap and hreflang machinery only emit alternates for locale rows that exist; partial translation produces a clean partial result, not a broken site. Posts that don't exist in the new locale will return 404 at `/<locale>/blog/<slug>` — which is correct behaviour; missing translations should never serve EN content under a non-EN URL.

---

## Step 5 — Update the blog routine prompt

`.routines/BLOG-POST-DAILY.md` already reads `SUPPORTED_LOCALES` from `src/lib/i18n/alternates.ts` at run time, so it picks up the new locale automatically. Verify by running through the checklist there:

- Does Step 1 ("Discover the active locales") return your new locale?
- Does the agent know to translate every new daily post into every locale that's now active?

If you want the agent to skip the new locale temporarily (e.g., translation queue is paid quarterly), add an explicit override to the routine ("temporarily skip <locale> until the translator returns from leave on YYYY-MM-DD"). Don't fork the routine — just leave a date-stamped note.

---

## Step 6 — Decide on `/privacy` and `/terms`

These pages are deliberately default-locale-only until you have legal-reviewed translations. The middleware's `LOCALIZABLE_PATHS` constant excludes them, so `/<locale>/privacy` 301-redirects to `/privacy`.

Two paths forward:

**Path A — keep them EN-only.** Add a banner at the top of the page ("English only — questions in your language? Email support@…") so the visitor knows the EN content is canonical. No code change beyond the banner.

**Path B — translate with legal review.** Pay a lawyer fluent in the target jurisdiction's consumer law to review the translation. Once the legal-reviewed translated copy is in hand:

1. Add `/privacy` and `/terms` back to `LOCALIZABLE_PATHS` in `src/middleware.ts`.
2. In `app/sitemap.ts`, change their `localized: false` flag to `true`.
3. Convert each page's static `metadata` in `app/privacy/page.tsx` + `app/terms/page.tsx` to a `generateMetadata()` that reads `getLocale()` and emits per-locale content + `localizedAlternates`.
4. Render the body content per-locale (use the same `Record<Locale, …>` pattern as the marketing pages).

Either way, document the decision in this file when you do it, so the next person knows whether the legal text is canonical EN-only or per-locale.

---

## Step 7 — Verify locally

```bash
# 1. Type check
npx tsc --noEmit

# 2. Run the dev server
npm run dev

# 3. In a browser:
#    - Visit /<new-locale>/  — body in the new language, <html lang="<new-locale>">
#    - Click around through home → onboard → blog → blog post → switch language → back home
#    - Open the locale switcher; new flag + label show; click EN, URL drops the prefix; click back
#    - Visit /sitemap.xml — search for `<xhtml:link rel="alternate" hreflang="<new-locale>"`
#    - Visit /<new-locale>/blog/<slug-not-yet-translated> — must 404, not render EN content
#    - Visit /<new-locale>/dashboard — must redirect to /dashboard (non-localizable path)
#    - Visit /<new-locale>/privacy — must redirect to /privacy (legal copy is EN-only by design)
```

For each marketing page, view source and confirm:

- `<html lang="<new-locale>">` matches the URL prefix.
- `<title>` is in the new language, not English-leaked.
- `<link rel="canonical">` points at the `/<new-locale>/...` URL, not at the EN URL.
- `<link rel="alternate" hreflang="<new-locale>">` self-references this URL, **and** every other locale's URL is listed too, **and** `x-default` points at the EN URL.
- `<meta property="og:locale" content="<locale>_<region>">` matches.

---

## Step 8 — Verify against Google Search Console after launch

After deploying:

1. Submit the updated sitemap in Search Console.
2. Use the URL Inspection tool on `/<new-locale>/` and confirm Google sees the new language version, the canonical, and the hreflang alternates.
3. Check the **International Targeting** report for hreflang errors (missing return tags, no hreflang tags for the new locale).
4. After ~2 weeks, check **Search Console → Performance → Country/Language** filter — impressions for the new locale should appear in its target market.

Hreflang takes ~1–4 weeks to propagate. Don't panic if Day 3 metrics show nothing.

---

## Quick checklist (copy-paste for PRs)

- [ ] `SUPPORTED_LOCALES` updated in `src/middleware.ts`, `src/lib/i18n/alternates.ts`, `src/lib/i18n/translations.ts`
- [ ] `Locale` type extended in `src/lib/i18n/translations.ts`
- [ ] Locale switcher flag SVG + `OPTIONS` entry + `LOCALE_PREFIXES_CLIENT` updated in `src/components/locale-switcher.tsx`
- [ ] All marketing-page `Record<Locale, …>` blocks have a value for the new locale (typecheck passes)
- [ ] Home page `HOME_META`, marketing-header `NAV_COPY`, onboard wizard inline strings, blog index `BLOG_INDEX_COPY`, footer copy all translated
- [ ] Translation Brief glossary updated with any new locale-specific terms
- [ ] Blog post library translated to the new locale (or a date-stamped plan committed for when it will be)
- [ ] Privacy/Terms decision documented (Path A or Path B above)
- [ ] Local verification (Step 7) all pass
- [ ] Lighthouse run on `/<new-locale>/` — no perf regression
- [ ] PR reviewed by a native speaker of the new language
- [ ] Sitemap submitted to Google Search Console post-deploy
- [ ] After 2–4 weeks: hreflang errors checked in Search Console, no own-goals
