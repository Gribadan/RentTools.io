# Rent Tool — Scheduled Routine Prompt

You are running as a scheduled routine. Read `D:\Python\rent-tool\.routines\TASKS.md`.

You have a **TIME BUDGET of 30 minutes** for this tick. Work through as
many tasks from the list as you can fit inside the budget. Each task
is its own atomic unit — commit and push after every single one,
never bundle two tasks into one commit.

Record a start timestamp at the very beginning of the tick. Before
starting each new task, check elapsed time:
  - if elapsed < 25 min, start the next task
  - if elapsed >= 25 min, stop the loop (don't start a new one)
  - hard cap: never start a new task past 35 min, even if a previous
    one ran long
This way you never blow far past 30 min, but you also don't waste
the tick when tasks finish quickly.

For EACH task you take on:

1. Find the FIRST task in TASKS.md whose checkbox is `- [ ]` (pending)
   AND that does NOT have a `Blocked:` line directly under it. That's
   the task. If no such task exists, output "All tasks complete." and
   stop the tick.

2. Read the task body in full, plus any files it points at. Read
   recent git log so you have current repo context.

3. Make the code changes the task describes.

4. Verify:
   - Run `npx next build` — MUST pass with zero errors.
   - For schema changes, run `npx prisma generate` and
     `npx tsx prisma/push-schema.ts` against the Turso DB.
   - For new dependencies: delete `node_modules` and run `npm ci` to
     confirm the lock file is consistent.
   - Re-read the task's "Acceptance criteria" — verify each bullet
     is actually met. Don't skip this; the user is not in the loop
     to catch sloppy completions.

5. Commit with a clear conventional-commit-style message that
   references the task id, e.g.
   `fix(api): add NaN validation on route params (RT-1.1)`.

6. Push to `origin master`.

7. Edit TASKS.md:
   - Flip `- [ ]` to `- [x]` on the task you just finished.
   - Append a single line to the "Done log" section at the bottom:
     `- YYYY-MM-DD — RT-X.X — <short SHA> — <one-line summary>`

8. Commit + push that TASKS.md update with message
   `chore(routines): mark RT-X.X done`.

9. Check elapsed time. If under 25 min and more pending tasks exist,
   loop back to step 1 for the next task. Otherwise stop.

---

## Hard rules (apply across the whole tick)

- **ONE task per commit.** Never bundle. The Done log is your audit
  trail — it must reflect each task's outcome individually.

- **If you hit a real blocker** on the CURRENT task (missing file,
  ambiguous spec, failing test you can't fix in scope, deps issue),
  DO NOT mark `[x]`. Append a line directly under the task in
  TASKS.md:
    `Blocked: <one-line reason, no more than 100 chars>`
  Commit + push that note with message
  `chore(routines): block RT-X.X — <reason>`, then SKIP this task
  and continue the loop — pick up the next pending un-blocked task
  within your time budget.

- **3-blocker rule**: if the SAME tick has already produced **3 or
  more** Blocked notes, stop the tick after the third blocker. Three
  blockers in one tick suggests systemic issues that need human review.

- **Never run destructive git operations** (force-push, reset --hard,
  branch -D). If something goes wrong, leave it for the user.

- **Never skip pre-commit hooks.**

- **Turso/LibSQL compatibility — CRITICAL**:
  - Do NOT use Prisma's `@updatedAt` directive — it generates queries
    incompatible with LibSQL. Use `DateTime?` (nullable) instead.
  - Do NOT add `NOT NULL` columns to existing tables in migrations —
    SQLite cannot add NOT NULL columns to tables with existing data
    unless a DEFAULT is provided. Use nullable columns or add DEFAULT.
  - After ANY schema change: run `npx tsx prisma/push-schema.ts` AND
    `npx tsx test-db.ts` (or equivalent query test) to verify the DB
    is accessible and data is returned. If the properties API returns
    500 instead of an array, the schema change broke the DB.
  - Schema migrations in push-schema.ts MUST match prisma/schema.prisma
    exactly (same nullability, same defaults).

- **This project is live with real users.** Be careful with:
  - Schema changes (additive only, never drop columns)
  - Calendar feed routes (platforms actively fetch these)
  - Extraction API (handles real passport data)
  - Auth/session logic
  Prefer additive changes. If a task forces a breaking change, write
  a `Blocked:` note and move on.

- **Manual-deploy tasks**: some tasks (especially Week 13 droplet setup,
  DNS cutover, Vercel decommission) require commands run on a server you
  cannot SSH to. For those, your job is to **prepare the files** the
  task points to (scripts, configs, docs) and verify the build passes.
  Then mark the task `[x]` only if the file deliverables are complete
  AND the task body explicitly says "no execution required for this
  task". Otherwise, write `Blocked: requires manual server execution`
  and skip — the user will execute and mark done afterward.

- **Don't touch tasks out of order** unless the current task is blocked
  (in which case you skip it and continue to the next).

- **Never extend the tick past 35 min** wall-clock by starting a new
  task. If you're mid-task at 35 min, finish it cleanly and stop.

---

## Project context

- **Stack**: Next.js 16 (App Router), TypeScript, Tailwind, Prisma 7
- **Database**:
  - **Source of truth (still)**: Turso (LibSQL) — production data lives here until cutover
  - **Migration target**: self-hosted SQLite at `file:./data/prod.db` on the DO droplet
  - `src/lib/prisma.ts` resolves to whichever is set via env vars (DATABASE_URL preferred, falls back to TURSO_*)
- **Deploy**:
  - **Production today**: Vercel auto-deploy from `master` (active, real users)
  - **Migration target**: DigitalOcean droplet at `64.226.83.37` (renttools.io)
  - Droplet bootstrap is DONE (Node 22, nginx, certbot, systemd, ufw, fail2ban, swap, app user, deploy key)
  - TLS cert issued for renttools.io via Let's Encrypt DNS-01 (auto-renewing)
  - Cutover happens at RT-13.11 — DO NOT touch Vercel until cutover succeeds
- **Hosting model**: free public SaaS at the owner's domain. Anyone can sign up and use it. The owner pays for hosting + Gemini API. Users get rate-limited per account to protect the free tier.
- **DB push**: `npx tsx prisma/push-schema.ts` (NOT `prisma db push` — works for both Turso and local SQLite via the same adapter script)
- **Build check**: `npx next build`
- **Tests**: vitest installed; run `npx vitest` (covers ical.ts, sanitize.ts, buffer logic)
- **Key files**:
  - `src/app/page.tsx` — main app with URL-based routing
  - `src/components/` — all UI components
  - `src/app/api/` — all API routes
  - `src/lib/` — utilities (ical.ts, calendar-sync.ts, auth.ts, prisma.ts, gemini.ts, ownership.ts)
  - `prisma/schema.prisma` — data model
  - `prisma/push-schema.ts` — migration script (Turso + local SQLite)
  - `.local/` — gitignored personal credentials, deploy notes, SSH keys (NEVER reference contents in commits)

---

## Output format (end of tick, keep under 12 lines)

```
Tasks completed: RT-X.X (<sha>), RT-X.X (<sha>)
Blocked: RT-X.X — <reason> (if any)
Elapsed: XXm
Next pending: RT-X.X (or "list empty")
```
