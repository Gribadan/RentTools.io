# Rent Tool

> Self-host your Airbnb + Booking.com calendar, cleaning schedule, and guest documents — or use it free at **[renttools.io](https://renttools.io)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tests: vitest](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest)](https://vitest.dev/)

A multi-tenant property and reservation manager for short-term rental owners. Pulls Airbnb / Booking.com calendars over iCal, lets you add manual bookings, runs a cleaning schedule, extracts passport data from photos with Gemini, and exposes a public iCal feed back to platforms.

Owners log in (or sign up), see only their own properties, and can add cleaners as restricted-role users.

<!-- Screenshots: drop PNGs into docs/screenshots/ to populate -->
| Calendar | Cleaning schedule | Guest cards |
| :---: | :---: | :---: |
| ![Calendar view](docs/screenshots/calendar.png) | ![Cleaning schedule](docs/screenshots/cleaning.png) | ![Guest cards](docs/screenshots/guests.png) |

---

## What it does

- Sync Airbnb + Booking.com via the iCal export URLs they already give you. Manual bookings live alongside synced ones with conflicts highlighted.
- Generate the cleaning schedule from check-out → check-in dates with per-property buffer days. Mark each cleaning done / skipped, print today's list.
- Extract passport fields (name, DOB, document number, country) from a photo via Google Gemini Vision. Output is sanitized for emehmon.uz / hotel registration forms.
- Render per-property message templates (`{{guestName}}`, `{{checkIn}}`, `{{checkOut}}`, `{{wifiPassword}}`) and copy to clipboard for Airbnb / WhatsApp.
- Expose a public iCal feed per property so the same platforms can read your manual bookings back.
- Cleaner role: a separate user role that sees only the cleaning schedule for assigned properties.

## Free hosted version

Don't want to run servers? Sign up at **[renttools.io](https://renttools.io)** — the same code, hosted by the maintainer, free for personal use. Rate-limited per account so the free tier stays free.

## Self-host (5-minute quickstart)

You need Node.js 20+ and either a Turso DB (cloud) or a local SQLite file.

```bash
git clone https://github.com/Gribadan/rent-tool.git
cd rent-tool
npm install

# Local SQLite — easiest for self-hosting
mkdir -p data
cat > .env.local <<EOF
DATABASE_URL=file:./data/prod.db
GEMINI_API_KEY=...                  # https://aistudio.google.com
JWT_SECRET=$(openssl rand -hex 32)
EOF

npm run db:push      # apply prisma/schema.prisma
npm run db:seed      # creates a superadmin (see prisma/seed.ts)
npm run dev          # http://localhost:3000
```

For production on a $6 DigitalOcean droplet (systemd + nginx + Let's Encrypt + cron + daily backups), see [docs/DROPLET-SETUP.md](docs/DROPLET-SETUP.md).

For the legacy Vercel + Turso path, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Features

- [x] Multi-tenant: signup, per-user property scoping, ownership cascade across nested resources
- [x] Calendar with synced Airbnb / Booking events, manual bookings, conflict highlighting, per-property buffer days, printable export
- [x] Cleaning schedule with done / skipped tracking and a printable today / tomorrow / week summary
- [x] Cleaner role with a stripped-down view of only assigned properties
- [x] Passport extraction via Gemini Vision with field sanitization (Cyrillic, diacritics)
- [x] Per-property message templates with variable substitution and copy-to-clipboard
- [x] Cmd-K guest search across every property you own
- [x] Activity feed, audit log, occupancy charts (recharts), CSV import / export of reservations
- [x] Onboarding: welcome modal, sample property generator, empty-state cards, inline tooltips
- [x] Profile panel with self-serve password change
- [x] Health endpoint, structured request logging, sync-failure alert banner
- [x] Mobile responsive (375px+), dark theme, PWA manifest
- [ ] Photo upload for completed cleanings *(needs blob storage)*
- [ ] Property documents tab + `{{document:rules}}` template variable *(needs blob storage)*
- [ ] Public landing page, OG meta, ToS / privacy *(in progress — Week 14)*
- [ ] Admin panel: signup toggle, per-user rate limit, kill switch, account deletion *(in progress — Week 15)*

## Roadmap

The full backlog with status and acceptance criteria lives in [.routines/TASKS.md](.routines/TASKS.md). Completed work is logged at the bottom of that file.

## Tech stack

| Layer       | Choice                                       |
| ----------- | -------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)           |
| Language    | TypeScript (strict)                          |
| UI          | Tailwind CSS 4, custom dark theme            |
| Charts      | recharts                                     |
| Auth        | jose JWT in HTTP-only cookie + bcryptjs      |
| ORM         | Prisma 7 client + LibSQL adapter             |
| Database    | SQLite (self-hosted) or Turso (LibSQL cloud) |
| AI          | Google Gemini (`@google/generative-ai`)      |
| Tests       | Vitest                                       |
| Deployment  | systemd + nginx on DigitalOcean (or Vercel)  |

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
  push-schema.ts        # SQLite/LibSQL migration runner (auto-detects)
  seed.ts
deploy/
  systemd/, nginx/      # production unit files
  cron/                 # 10-minute calendar sync cron
scripts/
  backup-db.sh          # daily SQLite backup with tiered retention
  check-resources.sh    # hourly RAM/disk alert
  deploy.sh             # zero-downtime droplet deploy
  migrate-turso-to-local.ts
docs/
  API.md                # endpoint reference
  DEPLOYMENT.md         # legacy Vercel + Turso walkthrough
  DROPLET-SETUP.md      # production droplet runbook
  CONTRIBUTING.md       # code style, branching, commit format
.routines/
  TASKS.md              # roadmap; the Done log records completed work
  ROUTINE.md            # routine-agent prompt (code tasks)
  OPS-ROUTINE.md        # routine-agent prompt (weekly droplet ops)
```

## Common tasks

```bash
npm run dev             # local dev (Turbopack)
npm run build           # production build
npm test                # run vitest once
npm run db:push         # push prisma/schema.prisma to the configured DB
npm run db:seed         # seed an admin user
```

To trigger a calendar sync manually (instead of waiting for cron):

```bash
curl -fsS "http://localhost:3000/api/calendar/cron?secret=$CRON_SECRET"
```

## Contributing

Issues and PRs welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for code style, branch naming, commit message format, and how to add a new route.

## License

MIT — see [LICENSE](LICENSE).
