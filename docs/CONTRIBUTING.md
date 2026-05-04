# Contributing

Issues and PRs are welcome. The hosted instance at [renttools.io](https://renttools.io) auto-deploys on every push to `master`, so the bar is **"build is green and the feature works"**. Be deliberate about schema changes — there are real users.

## Filing an issue

Before opening a new issue, search [existing issues](https://github.com/Gribadan/rent-tool/issues?q=is%3Aissue) — your problem may already be tracked.

If you don't find a match:

- **Bugs**: open a [bug report](https://github.com/Gribadan/rent-tool/issues/new?template=bug.md). Include reproduction steps, expected vs. actual behavior, and your environment (self-hosted or hosted, browser, OS).
- **Features**: open a [feature request](https://github.com/Gribadan/rent-tool/issues/new?template=feature.md). Describe the *use case* you're stuck on, not just the solution you have in mind. Many feature requests get rolled into the open-source roadmap in [.routines/TASKS.md](../.routines/TASKS.md).

The issue templates live in [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE).

## Getting set up locally

The 5-minute quickstart is in [README.md](../README.md#self-host-5-minute-quickstart). The TL;DR:

```bash
git clone https://github.com/Gribadan/rent-tool.git
cd rent-tool
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
- One logical change per commit. Don't bundle unrelated work.
- Append `Co-Authored-By: Claude <noreply@anthropic.com>` when an AI assistant wrote the change. The scheduled `.routines/` runs follow this same format and reference the task id (e.g. `feat(api): RT-7.4 — public iCal feed token`).
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

If something feels off, [open an issue](https://github.com/Gribadan/rent-tool/issues/new) and tag it `meta`. The maintainer will read it.
