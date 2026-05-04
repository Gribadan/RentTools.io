# Rent Tool

A self-hosted property and reservation manager for short-term rental owners. Pulls Airbnb / Booking.com calendars over iCal, lets you add manual bookings, runs a cleaning schedule, extracts passport data from photos with Gemini, and exposes a public iCal feed back to platforms.

The app is multi-tenant — owners log in (or sign up), see only their own properties, and can add cleaners as restricted-role users.

## Features

- **Calendar** with synced Airbnb/Booking events plus manual bookings, conflicts highlighted, per-property buffer days, and printable export
- **Cleaning schedule** with done/skipped tracking and a printable today/tomorrow/week summary
- **Passport extraction** via Gemini Vision — drop a photo, get fields back ready for emehmon.uz
- **Per-property message templates** with variable substitution (`{{guestName}}`, `{{checkIn}}`, …) and copy-to-clipboard
- **Activity feed**, **audit log**, **occupancy reports** (recharts), **CSV export/import** of reservations
- **Cmd-K guest search** across every property you own
- **Cleaner role** sees only an assigned-properties cleaning view

## Tech stack

| Layer       | Choice                                  |
| ----------- | --------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)      |
| Language    | TypeScript (strict)                     |
| UI          | Tailwind CSS 4, custom dark theme       |
| Charts      | recharts                                |
| Auth        | jose JWT in HTTP-only cookie + bcryptjs |
| ORM         | Prisma 7 client + LibSQL adapter        |
| Database    | Turso (LibSQL) — SQLite over HTTP       |
| AI          | Google Gemini (`@google/generative-ai`) |
| Tests       | Vitest                                  |
| Deployment  | Vercel + cron-job.org for the sync tick |

## Getting started locally

You need Node.js 20+ and a Turso database (free tier is fine). The `db:push` script wires Prisma's LibSQL adapter to Turso, so a local `*.db` file is not used.

```bash
# 1. clone + install
git clone https://github.com/Gribadan/rent-tool.git
cd rent-tool
npm install

# 2. create a Turso DB
curl -sSfL https://get.tur.so/install.sh | bash    # Turso CLI
turso auth signup
turso db create rent-tool-dev
turso db show rent-tool-dev --url
turso db tokens create rent-tool-dev

# 3. write .env.local
cat > .env.local <<EOF
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
GEMINI_API_KEY=...                # Google AI Studio
JWT_SECRET=$(openssl rand -hex 32)
EOF

# 4. push schema and seed an admin user
npm run db:push
npm run db:seed            # creates a superadmin (see prisma/seed.ts)

# 5. run the dev server
npm run dev
# open http://localhost:3000
```

If you run into issues, the most common cause is a Turso URL/token mismatch — `turso db show` and `turso db tokens create` both print to stdout and have to be copied into `.env.local` exactly.

## Project layout

```
src/
  app/
    api/                # all REST endpoints
    page.tsx            # main app shell, URL-driven view state
    layout.tsx
    login/, signup/
  components/           # UI components, one per feature
    calendar/           # extracted calendar primitives
  lib/                  # framework-agnostic helpers
    ical.ts             # iCal parse/generate + buffer logic
    calendar-sync.ts    # cron-driven sync routine
    sanitize.ts         # text sanitization for OCR'd fields
    auth.ts, prisma.ts, gemini.ts, audit.ts, logger.ts
prisma/
  schema.prisma         # data model
  push-schema.ts        # Turso/LibSQL migration runner
  seed.ts
docs/
  API.md                # endpoint reference
  DEPLOYMENT.md         # Vercel + Turso + cron-job.org walkthrough
  CONTRIBUTING.md       # code style, branching, commit format
.routines/
  TASKS.md              # roadmap; the Done log records completed work
```

## Common tasks

```bash
npm run dev             # local dev (Turbopack)
npm run build           # production build
npm test                # run vitest once
npm run db:push         # push prisma/schema.prisma to Turso
npm run db:seed         # seed an admin user
```

To trigger a calendar sync manually (instead of waiting for cron):

```bash
curl -X POST http://localhost:3000/api/calendar/cron \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full Vercel + Turso + cron-job.org walkthrough.

## API reference

See [docs/API.md](docs/API.md) for every endpoint with request/response shape.

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for code style, branch naming, commit message format, and how to add a new route.

## License

Private project — no license granted by default.
