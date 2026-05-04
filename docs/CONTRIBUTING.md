# Contributing

This project ships from `master` to Vercel on every push, so the bar is "build is green and feature works." Be deliberate about schema changes — there are real users.

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
  - Add the matching `ALTER TABLE` to `prisma/push-schema.ts` (this is what runs against Turso — `prisma db push` does not work with the LibSQL adapter)
  - SQLite cannot add `NOT NULL` columns to tables with data unless you supply a `DEFAULT`
  - Do **not** use Prisma's `@updatedAt` directive — it generates SQL incompatible with LibSQL. Use `updatedAt DateTime?` (nullable) and update in code if you care
- **i18n**: user-facing strings should ship in both English and Russian. The codebase mixes a `useI18n()` hook (`src/lib/i18n/`) with inline `locale === "ru"` ternaries — match whichever pattern the file already uses.

## Branching and commits

- Branch from `master`: `git checkout -b feat/<short-description>` (or `fix/`, `chore/`, `docs/`).
- **Conventional Commits**: `<type>(<scope>): <subject>` — e.g. `feat(reports): add CSV export with date range`. Types in use: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- One logical change per commit. Don't bundle unrelated work.
- Append `Co-Authored-By: Claude <noreply@anthropic.com>` when an AI assistant wrote the change. The scheduled `/.routines/TASKS.md` runs follow this same format.
- Never force-push `master`. Never bypass hooks (`--no-verify`).

## Testing

- We use [Vitest](https://vitest.dev). Run with `npm test` (single shot) or `npx vitest` (watch mode).
- Tests live next to the code: `src/lib/foo.ts` → `src/lib/foo.test.ts`.
- Pure helpers (parsing, math, sanitization) get unit tests. UI behavior is checked by hand for now.
- A change to `src/lib/ical.ts` or `src/lib/sanitize.ts` should come with a test or extend one.

## Adding a new API route

1. Create `src/app/api/<feature>/route.ts` and export `GET` / `POST` / etc. Each must call `getSession()`.
2. If it's a nested resource, look up the parent and refuse with `404` when `parent.userId !== session.userId`.
3. Wrap the handler body in `try/catch` and return a generic 500 on unexpected errors. Log the error with `console.error("Route error:", err)` so it shows up in the structured logger.
4. Add the route to [docs/API.md](API.md) with a one-line summary, request body, response shape, and auth requirement.
5. If the route mutates data, call `logAudit(session.userId, action, type, id, payload)` from `src/lib/audit.ts`.

## Adding a UI feature

1. Build the smallest working version first. Wire it into `src/app/page.tsx` (or a parent component) so the user can actually reach it.
2. Add empty states. The existing `<EmptyState>` component is the source of truth for "no data yet" cards.
3. Add loading + error states wherever you `fetch`. Don't leave `console.log` debugging behind.
4. Run `npm run build` before committing. The CI gate is the build, not lint warnings.

## Releasing

There is no release ceremony — pushing to `master` deploys to production via Vercel. The cron-job.org tick handles the periodic calendar sync; if you change `src/app/api/calendar/cron/route.ts` make sure the existing schedule still calls the right URL with the right `CRON_SECRET`.
