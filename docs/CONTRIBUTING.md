# Contributing

Issues and PRs are welcome. The hosted instance at [renttools.io](https://renttools.io) auto-deploys on every push to `master`, so the bar is **"build is green and the feature works"**. Be deliberate about schema changes — there are real users.

## Filing an issue

Before opening a new issue, search [existing issues](https://github.com/Gribadan/RentTools.io/issues?q=is%3Aissue) — your problem may already be tracked.

If you don't find a match:

- **Bugs**: open a [bug report](https://github.com/Gribadan/RentTools.io/issues/new?template=bug.md). Include reproduction steps, expected vs. actual behavior, and your environment (self-hosted or hosted, browser, OS).
- **Features**: open a [feature request](https://github.com/Gribadan/RentTools.io/issues/new?template=feature.md). Describe the *use case* you're stuck on, not just the solution you have in mind. Feature requests and current priorities are tracked in [GitHub Issues](https://github.com/Gribadan/RentTools.io/issues) — that's the roadmap. If you want to pick something up, comment on the issue first so we don't double-build it.

The issue templates live in [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE).

## Getting set up locally

The 5-minute quickstart is in [README.md](../README.md#self-host-5-minute-quickstart). The TL;DR:

```bash
git clone https://github.com/Gribadan/RentTools.io.git
cd RentTools.io
npm install
mkdir -p data
echo "DATABASE_URL=file:./data/prod.db" >> .env.local
echo "GEMINI_API_KEY=..." >> .env.local
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.local
npm run db:push
npm run db:seed
npm run dev
```

For deeper deployment guidance see [docs/DROPLET-SETUP.md](DROPLET-SETUP.md) — production droplet runbook (systemd, nginx, cron, backups).

## Security & privacy — what must never reach git

This is a **public repository** and the hosted instance has **real users with real guest data**. Everything you commit — the diff, the commit message, file names, screenshots — is permanently visible and indexable. Force-pushing does not truly erase it.

**Never commit:**

- **Secrets** — `JWT_SECRET`, `CRON_SECRET`, API keys, OAuth client secrets, DB connection strings, SSH/signing keys. Real values live only in `.env.local` (dev) or `.env.production` (server), both gitignored. `.env.example` is the only env file in git, and it holds placeholders only.
- **Customer / guest data** — real names, emails, phone numbers, passport images or numbers, real reservation dates tied to a real person, real property names from the hosted instance. Use the sample-property generator (`/api/properties/sample`) or synthetic data in tests and screenshots.
- **PII in commit messages or code comments** — no real usernames, no emails, no quoted customer feedback. If you need to reference a specific report, use an opaque internal id ("feedback id=42") or a generic description ("a multi-platform host"), never anything that identifies a person.
- **Private infrastructure detail** — server IPs, droplet hostnames, internal task backlogs.

**Three automated layers back this up** (you don't have to think about them, but know they exist):

1. `.gitignore` — keeps whole private files/folders untracked.
2. `.githooks/pre-commit` — auto-registered by `npm install`; blocks a commit that stages a forbidden file **or** whose diff contains a secret-shaped string (provider key prefixes, PEM private-key headers).
3. CI (`.github/workflows/ci.yml`) — re-runs both scans on every PR, so a commit made with `--no-verify` or without the hook still gets caught before merge.

**If you ever commit a real secret:** don't just delete it in a follow-up commit — **rotate the credential**. Assume it is compromised the instant it lands in a commit, even if you remove it seconds later. Then tell the maintainer so the key can be revoked server-side.

When in doubt, ask in an issue before committing — it is far cheaper than a leak.

## Code style

- **TypeScript strict** everywhere. No `any` (use `unknown` and narrow). No `// @ts-ignore`.
- **React server components by default**; only mark a file `"use client"` when it needs hooks, browser APIs, or event handlers.
- **Functional components** with hooks. No class components, no HOCs.
- **Tailwind only** for styling — no CSS modules, no styled-components. Match the existing dark palette (`#18181b` cards, `#27272b` borders, `#e8e8ec` text, `#71717a` muted, `#ff385c` Airbnb red).
- **Small focused components**. If a file passes ~300 lines or owns multiple responsibilities, split it (see `src/components/calendar/`).
- **No comments explaining what code does** — names should already say that. Comments are reserved for non-obvious *why*: subtle invariants, workarounds, hidden constraints.
- **No speculative abstractions.** Don't add config knobs that aren't asked for. Three similar lines is better than a premature helper.

## Project conventions

- **API routes** live under `src/app/api/<feature>/route.ts`. Handlers must:
  - call `getSession()` and 401 on no session
  - validate IDs with `parseInt` + `isNaN` checks (return 400 on bad IDs)
  - wrap the body in `try/catch` and return `{ error: "Internal server error" }` 500 on unhandled errors
  - enforce ownership: nested resources must verify the parent property's `userId === session.userId` and return **404** (not 403) on mismatch
- **Mutations** should call `logAudit(...)` from `src/lib/audit.ts` so they appear in the activity feed and audit panel.
- **Schema changes** must be additive in production:
  - Edit `prisma/schema.prisma`
  - Add the matching `ALTER TABLE` to `prisma/push-schema.ts` (this is what runs against both Turso and the local SQLite file — `prisma db push` does not work with the LibSQL adapter)
  - SQLite cannot add `NOT NULL` columns to tables with data unless you supply a `DEFAULT`
  - Do **not** use Prisma's `@updatedAt` directive — it generates SQL incompatible with LibSQL. Use `updatedAt DateTime?` (nullable) and update in code if you care
- **i18n**: user-facing strings should ship in both English and Russian. The codebase mixes a `useI18n()` hook (`src/lib/i18n/`) with inline `locale === "ru"` ternaries — match whichever pattern the file already uses.
- **Routes**: the marketing landing lives at `src/app/page.tsx`; the authenticated app shell lives at `src/app/dashboard/page.tsx`. Wire new in-app features through the dashboard, not the landing.

## Branching and commits

- Branch from `master`: `git checkout -b feat/<short-description>` (or `fix/`, `chore/`, `docs/`).
- **Conventional Commits**: `<type>(<scope>): <subject>` — e.g. `feat(reports): add CSV export with date range`. Types in use: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- One logical change per commit. Don't bundle unrelated work. The commit message should explain *why* the change is needed — the diff already shows what.
- Never force-push `master`. Never bypass hooks (`--no-verify`) — if a hook fails, fix the underlying issue.

## Testing

- We use [Vitest](https://vitest.dev). Run with `npm test` (single shot) or `npx vitest` (watch mode).
- Tests live next to the code: `src/lib/foo.ts` → `src/lib/foo.test.ts`.
- Pure helpers (parsing, math, sanitization) get unit tests. UI behavior is checked by hand for now.
- A change to `src/lib/ical.ts` or `src/lib/sanitize.ts` should come with a test or extend one.

## CI

- Every PR runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) on GitHub Actions: `npm ci`, `npx next build`, `npx vitest run`. No secrets are required — the build is hermetic.
- **PRs need a green CI before review.** A red build means the change broke type-check, build, or tests; fix it locally with `npx next build && npx vitest run` before pushing the next commit.
- The CI badge at the top of [README.md](../README.md) reflects the latest `master` build.

## Adding a new API route

1. Create `src/app/api/<feature>/route.ts` and export `GET` / `POST` / etc. Each must call `getSession()`.
2. If it's a nested resource, look up the parent and refuse with `404` when `parent.userId !== session.userId`.
3. Wrap the handler body in `try/catch` and return a generic 500 on unexpected errors. Log the error with `console.error("Route error:", err)` so it shows up in the structured logger.
4. Add the route to [docs/API.md](API.md) with a one-line summary, request body, response shape, and auth requirement.
5. If the route mutates data, call `logAudit(session.userId, action, type, id, payload)` from `src/lib/audit.ts`.

## Adding a UI feature

1. Build the smallest working version first. Wire it into `src/app/dashboard/page.tsx` (or a parent component) so the user can actually reach it.
2. Add empty states. The existing `<EmptyState>` component is the source of truth for "no data yet" cards.
3. Add loading + error states wherever you `fetch`. Don't leave `console.log` debugging behind.
4. Run `npm run build` before committing. The CI gate is the build, not lint warnings.
5. If the change touches the landing page, terms, or privacy pages, eyeball it at 375px width too — mobile users matter.

## Releasing

There is no release ceremony — pushing to `master` deploys to production. The 10-minute cron tick on the droplet handles periodic calendar sync; if you change `src/app/api/calendar/cron/route.ts` make sure `deploy/cron/rent-tool.cron` still calls the right URL with the right `CRON_SECRET`.

## Code of conduct (lite)

Be nice. The maintainer is one person, the hosted instance is free, and most contributors are juggling jobs and lives. Specifically:

- **No personal attacks, harassment, or discrimination.** Disagree with code or design — never with people.
- **Assume good faith.** A short reply isn't rudeness; a request for changes isn't rejection. Both sides are usually trying to ship a good product.
- **Keep guest data private.** Don't post real passport photos, real reservations, or real guest names in issues, screenshots, or test fixtures. Use synthetic data — the sample-property generator (`/api/properties/sample`) is there for a reason.
- **No spam, scraping, or commercial promotion.** Issues and PRs are for improving the project.

If something feels off, [open an issue](https://github.com/Gribadan/RentTools.io/issues/new) and tag it `meta`. The maintainer will read it.
