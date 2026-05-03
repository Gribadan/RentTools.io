# Deployment Guide

This walks through deploying Rent Tool from a clean machine to a working
Vercel-hosted instance backed by Turso (LibSQL) and a cron-job.org schedule.

## 1. Prerequisites

- Node.js 20+ and npm
- A GitHub account with this repo forked or cloned
- A [Vercel](https://vercel.com) account
- A [Turso](https://turso.tech) account (free tier is fine)
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini Vision
- A [cron-job.org](https://cron-job.org) account (or any HTTPS pinger)

## 2. Provision the database

```bash
# install the Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

turso auth signup     # or: turso auth login
turso db create rent-tool

# capture the URL and an auth token — you'll need both
turso db show rent-tool --url
turso db tokens create rent-tool
```

Save the URL and token; you'll paste them into Vercel's env vars.

## 3. Local setup (optional, for development)

```bash
git clone https://github.com/<your-fork>/rent-tool.git
cd rent-tool
npm ci
```

Create `.env.local`:

```bash
TURSO_DATABASE_URL="libsql://rent-tool-<org>.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOi..."
GOOGLE_GEMINI_API_KEY="AIza..."
JWT_SECRET="<long-random-string>"   # used to sign session cookies
CRON_SECRET="<long-random-string>"  # used to gate /api/calendar/cron
```

Push the schema to Turso (uses the adapter — `prisma db push` does **not** work):

```bash
npx tsx prisma/push-schema.ts
```

Seed the initial superadmin (edit `prisma/seed.ts` first to change the
default username/password — the file currently bakes in development creds):

```bash
npx tsx prisma/seed.ts
```

Run the dev server:

```bash
npm run dev
```

Run the test suite:

```bash
npm test
```

## 4. Deploy to Vercel

1. Push your fork to GitHub.
2. In Vercel: **New Project → Import Git Repository**, pick the rent-tool repo.
3. Framework preset auto-detects as Next.js. Root directory `./`. Build command
   `npm run build`. Output `.next` (defaults are correct).
4. Set environment variables (Production + Preview):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `GOOGLE_GEMINI_API_KEY`
   - `JWT_SECRET`
   - `CRON_SECRET`
5. Deploy. The first build runs `prisma generate` via `postinstall`.

After the first successful deploy, push the schema once from your local
machine (Turso is shared between local and prod):

```bash
npx tsx prisma/push-schema.ts
```

Subsequent commits to `master` auto-deploy.

## 5. Set up the calendar sync cron

Calendar sync needs a steady external trigger because Vercel's free tier doesn't
guarantee long-running background tasks. The endpoint is
`GET /api/calendar/cron?token=$CRON_SECRET`.

1. Sign in to [cron-job.org](https://console.cron-job.org/).
2. **Create cronjob**:
   - Title: `rent-tool calendar sync`
   - URL: `https://<your-vercel-domain>/api/calendar/cron?token=<CRON_SECRET>`
   - Schedule: every 30 minutes (or whatever cadence you prefer)
   - Method: GET
3. Save and run once manually to confirm a `200` response.

## 6. Connect platform iCal feeds

Inside the running app:

1. Log in as the superadmin.
2. **Properties → Add property** for each rental.
3. Per property, **Sync settings → Add calendar link** for both Airbnb and
   Booking.com. Paste each platform's iCal export URL.
4. The app exposes per-property feeds at:
   - `https://<your-vercel-domain>/api/calendar/feed/<propertyId>` (combined)
   - `?platform=airbnb` or `?platform=booking` for filtered feeds
5. Import those URLs back into the platforms' iCal subscription settings so
   each platform sees the other's bookings + your buffer days.

## 7. Health checks

- `GET /api/calendar/health` reports per-property feed status.
- `GET /api/calendar/sync?propertyId=X` shows the last sync timestamp and any
  errors per platform.

## 8. Rotating secrets

To rotate `JWT_SECRET` or `CRON_SECRET`, update the value in Vercel env vars
and redeploy. Rotating `JWT_SECRET` invalidates all existing session cookies —
users will be forced to log in again.

## 9. Troubleshooting

- **Login fails with valid creds**: check `JWT_SECRET` is set in production
  and has not changed since the cookie was issued.
- **Sync never runs**: confirm cron-job.org is firing (check its history) and
  the URL includes the correct `?token=`.
- **Gemini extraction returns no data**: `GOOGLE_GEMINI_API_KEY` may be unset
  or rate-limited; check Vercel function logs.
- **Schema drift**: re-run `npx tsx prisma/push-schema.ts`. The script is
  idempotent — it uses `CREATE TABLE IF NOT EXISTS` and additive `ALTER TABLE`s.
