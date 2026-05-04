# Rent Tool — Production Roadmap

A 4-month plan to take this from "personal tool that works" to "real SaaS people pay for."

Current state: working multi-property calendar manager with Airbnb/Booking sync, cleaning automation, manual overrides, guest passport extraction. Deployed on Vercel + Turso. **Missing the SaaS basics**: multi-tenancy, signup, billing, notifications, legal, monitoring.

**Legend:** 🔴 blocker for paid users · 🟠 high impact · 🟡 nice-to-have · 🔵 polish

---

## Month 1 — Production hardening

The goal: make it safe to invite real users besides yourself.

### Multi-tenancy 🔴
- [ ] Add `userId` FK to `Property` (cascade on user delete)
- [ ] Backfill existing data to current superadmin
- [ ] Enforce ownership check in every API route (`/api/properties`, `/api/reservations`, `/api/guests`, `/api/calendar/*`, `/api/date-overrides`)
- [ ] Update Property fetches to filter by current user
- [ ] Add `Workspace` concept later (multiple users sharing properties — co-hosts, cleaners)

### Auth & onboarding 🔴
- [ ] Public signup page `/signup` (email + password)
- [ ] Email verification flow (token in URL)
- [ ] Password reset flow (forgot password → email link → reset)
- [ ] Welcome modal on first login (sample property option)
- [ ] Inline tooltips for first-time users
- [ ] Profile page (change email, change password, delete account)

### Security 🔴
- [ ] Rate limit auth endpoints (5 attempts/min per IP)
- [ ] Rate limit feed endpoints (60 req/min per propertyId)
- [ ] Security headers via middleware (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] Validate `JWT_SECRET` and other critical env vars at startup; refuse to boot with defaults
- [ ] Document feed URL security model (iCal feeds are public-by-design — anyone with URL can read)
- [ ] Add per-user feed token option (rotatable — invalidates old URLs)
- [ ] CORS policy on API routes (tight by default)
- [ ] Audit log table (who did what when)

### Error handling 🔴
- [ ] `app/error.tsx` for global runtime errors
- [ ] `app/not-found.tsx` for 404s
- [ ] React error boundary around main views
- [ ] Friendly error pages with "report issue" link

### Email 🔴
- [ ] Pick provider (Resend recommended — cheapest, dev-friendly)
- [ ] Email templates: signup verification, password reset, welcome
- [ ] Email queue (background jobs via Vercel Cron or Inngest)

### Legal & GDPR 🟠
- [ ] `/privacy` page (template + customize)
- [ ] `/terms` page (template + customize)
- [ ] Cookie consent banner if EU traffic
- [ ] Account export endpoint (download all your data as JSON)
- [ ] Account deletion endpoint (cascade everything)

### Monitoring 🟠
- [ ] Sentry integration (free tier — errors only)
- [ ] Vercel analytics enabled
- [ ] Error alert webhook to Slack/email on cron failures
- [ ] Document operational runbook (what to do when X breaks)

### Mobile responsiveness 🟠
- [ ] Test all views at 375px (iPhone SE)
- [ ] Test all views at 768px (iPad)
- [ ] Mobile-friendly date popover (full-screen modal on small screens)
- [ ] Property selector dropdown sized for touch
- [ ] Cleaning schedule table → card layout on mobile

---

## Month 2 — Core feature polish

The goal: features people actually pay for, beyond what Airbnb does natively.

### Cleaning workflow 🟠
- [ ] Cleaner team management (add cleaners as separate users with limited role)
- [ ] Assign cleaner to specific property or specific cleaning
- [ ] Cleaner-only view (just shows their assigned cleanings, no booking details)
- [ ] Mark cleaning as done/in-progress/skipped (status tracking)
- [ ] Photo upload after cleaning (proof + condition log)
- [ ] Cleaner notification: SMS or email day-before for next-day cleanings
- [ ] Cleaning checklist templates per property type

### Guest communication 🟠
- [ ] Email/WhatsApp templates: pre-arrival info, check-in instructions, post-stay thanks
- [ ] Auto-send 3 days before check-in (configurable)
- [ ] Manual send from reservation view
- [ ] Variables: `{{guestName}}`, `{{checkIn}}`, `{{wifiPassword}}`, etc.
- [ ] Per-property message library

### Property documents 🟡
- [ ] Documents tab per property (rules, instructions, photos, manuals)
- [ ] File upload (PDF, images) to S3-compatible storage
- [ ] Share doc link with guests via email template variable

### Reports & exports 🟠
- [ ] Occupancy rate per property (this month, last month, YTD)
- [ ] Revenue tracking (manual entry of price per booking)
- [ ] Export reservations to CSV
- [ ] Export tax-ready report by date range
- [ ] Year-over-year comparison

### Dashboard improvements 🔵
- [ ] Replace property cards with richer summary: today/tomorrow events, occupancy %, monthly revenue
- [ ] Activity feed (recent syncs, bookings, conflicts, cleanings)
- [ ] Quick stats: bookings this week, cleanings due, conflicts to resolve

### Reviews tracking 🟡
- [ ] Pull reviews from Airbnb/Booking iCal (limited — most platforms don't expose via iCal)
- [ ] Manual review entry per reservation
- [ ] Average rating per property

### PWA polish 🔵
- [ ] Service worker for offline read-only mode
- [ ] Install prompt
- [ ] Push notifications (cleaning reminders, new bookings)

---

## Month 3 — Growth & monetization

The goal: charge money, keep users.

### Billing 🔴
- [ ] Stripe integration
- [ ] Pricing tiers: Free (1 property), Pro (5 properties, $9/mo), Business (unlimited, $29/mo)
- [ ] Subscription management page (upgrade, cancel, invoice history)
- [ ] Trial period (14 days Pro)
- [ ] Card-on-file for trial-to-paid auto-conversion
- [ ] Webhook handler for subscription events
- [ ] Property limit enforcement based on tier
- [ ] Grace period on failed payments (7 days)

### Smart pricing 🟠
- [ ] Pricing recommendations based on demand (compare with PriceLabs/Wheelhouse data?)
- [ ] Set base price + weekend modifier per property
- [ ] Push prices back to Airbnb/Booking via their APIs (requires partner approval)
- [ ] Manual price overrides per date

### Marketing site 🟠
- [ ] `/` landing page (currently login redirect — make it a real marketing page)
- [ ] Feature highlights with screenshots
- [ ] Pricing page
- [ ] Customer testimonials section
- [ ] Demo video / interactive demo
- [ ] Blog (Markdown-based for SEO)
- [ ] Open Graph meta tags for social shares

### Smart locks integration 🟡
- [ ] Pick one provider to start (TTLock, Igloohome, or August)
- [ ] Auto-generate codes per booking (valid check-in to check-out)
- [ ] Send code via guest message template

### API & integrations 🟡
- [ ] Public API with API key auth
- [ ] Webhooks: booking.created, cleaning.due, conflict.detected
- [ ] Zapier integration (or Make)
- [ ] API docs site (Mintlify or hand-rolled)

### Help & support 🟠
- [ ] Help center (Markdown-based, in-app + public)
- [ ] In-app chat widget (Crisp free tier or Intercom)
- [ ] Email support address with auto-response
- [ ] Status page (status.renttool.com — Atlassian Statuspage free tier)
- [ ] Changelog page

---

## Month 4 — Scale & infrastructure

The goal: handle growth, move off Vercel free tier.

### Infrastructure migration 🟠
- [ ] Move from Vercel to Digital Ocean App Platform (or VPS + Caddy)
- [ ] Move from Turso to managed Postgres (DO Managed DB or Neon)
- [ ] Migrate Prisma schema (SQLite → Postgres)
- [ ] Setup CI/CD (GitHub Actions → DO)
- [ ] Cloudflare in front for DDoS + caching
- [ ] Backup strategy: daily snapshots + weekly to S3

### Performance 🟠
- [ ] Database indexing audit (Reservation by checkIn, CalendarEvent by propertyId+startDate)
- [ ] Cache iCal feed responses (60s TTL on edge)
- [ ] Lazy-load heavy components (calendar, guest cards)
- [ ] Image optimization (Next/image)
- [ ] Bundle size audit
- [ ] Web Vitals monitoring (LCP, FID, CLS)

### Mobile app 🟡
- [ ] Decide: PWA-only vs React Native
- [ ] If PWA: full-screen mobile UX, push notifications
- [ ] If RN: shared API, native calendar widget, lock screen widget for today's events

### Real-time collaboration 🟡
- [ ] Multiple users editing same property
- [ ] Presence indicators (who's viewing what)
- [ ] Live updates (websocket or SSE)
- [ ] Conflict resolution on simultaneous edits

### Analytics for owners 🟡
- [ ] Per-property metrics: ADR (avg daily rate), RevPAR, occupancy trends
- [ ] Booking lead time analysis
- [ ] Source breakdown (Airbnb vs Booking vs direct)
- [ ] YOY growth charts

### Customer success 🟡
- [ ] Onboarding email drip (day 1, 3, 7, 14)
- [ ] Usage analytics — flag users who haven't synced in 7 days
- [ ] NPS survey at day 30
- [ ] Cancellation survey + win-back flow

---

## Quick wins (do anytime, low effort, high value)

- [ ] Sample property + sample bookings on signup (better demo)
- [ ] Bulk actions in cleaning schedule (skip multiple at once)
- [ ] Keyboard shortcuts (← → for month nav, T for today, E for edit mode)
- [ ] Dark/light theme toggle (currently dark-only)
- [ ] Calendar drag-to-create reservation
- [ ] Reservation duplication
- [ ] Bulk import from CSV
- [ ] Print-friendly cleaning schedule
- [ ] Browser notifications for sync errors
- [ ] Multi-language: add ES, FR, DE
- [ ] Mobile bottom nav (replace top tabs on small screens)
- [ ] Search bar across guests/properties/dates

---

## Tech debt & refactors

- [ ] Replace `window.location.reload()` in extend-booking with proper state refresh
- [ ] Move shared logic in property-calendar / cleaning-schedule into `lib/calendar-logic.ts`
- [ ] Consolidate two feed routes into one (`[filename]` is canonical, redirect query-param route)
- [ ] Add unit tests for: cleaning computation, buffer logic, feed generation, conflict detection
- [ ] E2E tests for: signup, create property, sync, manual override, extend booking
- [ ] Rename `bookingWindow` to `bookingWindowDays` for clarity
- [ ] Remove unused sidebar.tsx (we use top-bar.tsx now)
- [ ] Type-safe i18n (currently translation keys are loose strings)

---

## Parking lot (interesting but unscoped)

- AI-suggested response to negative reviews
- AI extraction of guest preferences from messages
- Channel manager features (post bookings to multiple platforms)
- Property listing builder (generate Airbnb-ready descriptions)
- Energy/utility tracking per property
- Maintenance ticket system
- Tax calculator per region
- Multi-currency support
- Owner reports (white-label, sent to property owners by managers)
- Co-host workflows (revenue split tracking)
