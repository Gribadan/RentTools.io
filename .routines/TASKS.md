# Rent Tool — Task Backlog

> Ordered by priority. Work top-to-bottom. Each task is atomic — one commit per task.

---

## Week 1 — Security & Stability

- [x] **RT-1.1** Add parseInt/NaN validation on all dynamic route params
  - Files: `src/app/api/properties/[id]/route.ts`, `src/app/api/reservations/[id]/route.ts`, `src/app/api/guests/[id]/route.ts`, `src/app/api/users/[id]/route.ts`, `src/app/api/calendar/links/[id]/route.ts`
  - For each: after `const { id } = await params`, add `const numId = parseInt(id); if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });`
  - Use `numId` in all subsequent Prisma calls
  - Acceptance criteria: all 5 route files validate IDs; hitting `/api/properties/abc` returns 400 not 500

- [x] **RT-1.2** Wrap all API routes in try-catch with consistent error responses
  - Files: all `route.ts` files under `src/app/api/` that lack try-catch
  - Pattern: wrap handler body in `try { ... } catch (err) { console.error("Route error:", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }`
  - Do NOT change routes that already have try-catch (extract, calendar/feed, calendar/cron)
  - Acceptance criteria: no API route can throw an unhandled exception to the client

- [x] **RT-1.3** Add date validation on reservation creation
  - File: `src/app/api/reservations/route.ts`
  - Validate: `checkIn` and `checkOut` are valid ISO date strings, `checkOut > checkIn`
  - Return 400 with descriptive error if invalid
  - Acceptance criteria: POST with `checkOut` before `checkIn` returns 400; POST with `checkIn: "not-a-date"` returns 400

- [x] **RT-1.4** Add confirmation dialogs before destructive actions
  - Files: `src/components/property-calendar.tsx`, `src/components/guest-cards.tsx`, `src/components/dashboard.tsx`
  - Replace direct `onDelete*` calls with `if (confirm("Delete this [item]? This cannot be undone."))` guards
  - Apply to: delete property, delete reservation, delete guest
  - Acceptance criteria: clicking delete on any item shows browser confirm dialog; canceling does nothing

- [x] **RT-1.5** Add password minimum length validation
  - Files: `src/app/api/users/route.ts` (POST handler), `src/app/api/auth/login/route.ts`
  - In user creation: reject passwords shorter than 8 characters with 400 error
  - Acceptance criteria: creating user with 5-char password returns 400 with "Password must be at least 8 characters"

---

## Week 2 — Data Integrity & UX Polish

- [x] **RT-2.1** Add `updatedAt` field to Property, Reservation, and Guest models
  - File: `prisma/schema.prisma`, `prisma/push-schema.ts`
  - Add `updatedAt DateTime @updatedAt` to Property, Reservation, Guest models
  - Add ALTER TABLE migrations in push-schema.ts
  - Run `npx prisma generate`
  - Acceptance criteria: `npx prisma generate` succeeds; `npx tsx prisma/push-schema.ts` succeeds

- [x] **RT-2.2** Prevent duplicate reservations on overlapping dates
  - File: `src/app/api/reservations/route.ts`
  - Before creating: query existing reservations for same propertyId where date ranges overlap
  - Return 409 Conflict if overlap found: `{ error: "Overlapping reservation exists", existing: { name, checkIn, checkOut } }`
  - Acceptance criteria: creating two reservations for same property with overlapping dates returns 409

- [x] **RT-2.3** Add loading spinners to all data-fetching operations
  - File: `src/app/page.tsx`
  - Add `loading` state for `fetchProperties`, show a subtle spinner in the TopBar or main content area while loading
  - Also add loading state to Dashboard and PropertyCalendar for their synced event fetches
  - Acceptance criteria: initial page load shows spinner until properties loaded; no flash of empty content

- [x] **RT-2.4** Add reservation search/filter to Dashboard
  - File: `src/components/dashboard.tsx`
  - Add a search input above the reservations list
  - Filter reservations by guest name (case-insensitive substring match)
  - Acceptance criteria: typing "igor" in search shows only reservations with "igor" in the name; clearing search shows all

- [x] **RT-2.5** Show total guest count per property in the TopBar property selector
  - File: `src/components/top-bar.tsx`
  - For each property in the dropdown, show reservation count and total guest count
  - Format: "Property Name (3 reservations, 12 guests)"
  - Acceptance criteria: property dropdown shows counts; counts update when reservations are added/deleted

---

## Week 3 — Calendar & Sync Reliability

- [x] **RT-3.1** Add sync health indicator to property calendar header
  - File: `src/components/property-calendar.tsx`
  - Fetch last sync time and errors from `/api/calendar/sync?propertyId=X`
  - Show green dot + "Synced 5m ago" or red dot + "Sync error: ..." in the calendar header
  - Acceptance criteria: calendar header shows sync status; error state shows red with message

- [x] **RT-3.2** Add "Sync Now" button to property calendar
  - File: `src/components/property-calendar.tsx`
  - Add a refresh icon button next to the property name
  - Clicking triggers POST `/api/calendar/sync`, shows spinner, then refetches events
  - Acceptance criteria: button triggers sync; spinner shows during sync; calendar updates after

- [x] **RT-3.3** Fix calendar bar rendering for multi-month bookings
  - File: `src/components/property-calendar.tsx`
  - Test: navigate to a month where a booking starts in a previous month (e.g., Oct booking starting Sep)
  - Ensure the bar renders from day 1 of the month, not missing
  - Ensure the bar label shows on the first visible day
  - Acceptance criteria: booking spanning Sep 28 — Oct 5 shows bar from Oct 1-5 with label on Oct 1

- [x] **RT-3.4** Add feed health check endpoint
  - New file: `src/app/api/calendar/health/route.ts`
  - GET: for each property with calendar links, check if feeds are accessible and valid
  - Return: `{ properties: [{ id, name, airbnbFeed: { url, status, eventCount }, bookingFeed: { ... } }] }`
  - Acceptance criteria: endpoint returns 200 with feed status for each property

- [x] **RT-3.5** Log sync event counts in Tasks panel summary
  - File: `src/components/tasks-panel.tsx`
  - Below the "Last sync" info, show a breakdown: "Airbnb: 22 events, Booking: 8 events" per property
  - Fetch from `/api/calendar/sync?propertyId=X` for event counts
  - Acceptance criteria: Tasks page shows per-platform event counts

---

## Week 4 — Guest Management & Extraction

- [x] **RT-4.1** Add ability to manually edit guest data after extraction
  - File: `src/components/guest-cards.tsx`
  - Add an "Edit" button on each guest card header
  - Clicking opens inline editing for all fields (name, DOB, passport, etc.)
  - Save via PATCH `/api/guests/[id]` (need to add PATCH handler for all fields)
  - Acceptance criteria: can edit and save any guest field; changes persist after refresh

- [x] **RT-4.2** Add PATCH endpoint for full guest updates
  - File: `src/app/api/guests/[id]/route.ts`
  - Add PATCH handler accepting any guest field update
  - Validate: passportNumber should be stripped of spaces, issuedBy should use sanitizeAlphanumeric
  - Acceptance criteria: PATCH with `{ fullName: "New Name" }` updates the guest; sanitization applies

- [x] **RT-4.3** Add guest data export to CSV
  - File: `src/components/reservation-view.tsx`
  - Add "Export CSV" button next to the guest cards section
  - Generate CSV with all guest fields, download via browser
  - Acceptance criteria: clicking export downloads a .csv file with all guests for that reservation

- [x] **RT-4.4** Show extraction success rate in reservation view
  - File: `src/components/reservation-view.tsx`
  - After extraction, show summary: "Extracted 3/3 passports successfully" or "2/3 extracted, 1 failed"
  - Include which files failed and why (from the log)
  - Acceptance criteria: extraction results show per-file status clearly

- [x] **RT-4.5** Auto-calculate yearsOld from DOB on each page load
  - File: `src/components/guest-cards.tsx`
  - Instead of showing the stored `yearsOld` (which gets stale), calculate age from `dateOfBirth` dynamically
  - Keep the stored value as fallback if DOB is missing
  - Acceptance criteria: guest age updates correctly when viewed in a new year

---

## Week 5 — Testing & Documentation

- [x] **RT-5.1** Set up testing framework (Vitest)
  - Install: `vitest`, `@testing-library/react` (if needed)
  - Create `vitest.config.ts` with path aliases matching tsconfig
  - Create first test: `src/lib/ical.test.ts` — test `parseICal`, `generateICal`, `addDays`, `generateBufferedEvents`
  - Acceptance criteria: `npx vitest run` passes with at least 5 tests for ical.ts

- [x] **RT-5.2** Add unit tests for extraction sanitization
  - File: `src/app/api/extract/route.test.ts` or `src/lib/sanitize.test.ts`
  - Extract sanitization functions to `src/lib/sanitize.ts` (transliterate, sanitizeText, sanitizeAlphanumeric, stripSpaces)
  - Test: Cyrillic transliteration, dot/dash stripping, space collapsing, passport number stripping
  - Acceptance criteria: at least 10 test cases covering edge cases (empty strings, mixed scripts, special chars)

- [x] **RT-5.3** Add unit tests for calendar buffer logic
  - File: `src/lib/ical.test.ts` (extend)
  - Test `generateBufferedEvents`: normal buffers, merged buffers, buffer=0, single event, adjacent events
  - Test `generateBufferOnlyEvents`: same-platform buffer generation
  - Acceptance criteria: at least 8 test cases for buffer logic

- [x] **RT-5.4** Add API documentation README
  - File: `docs/API.md`
  - Document all API endpoints: method, path, request body, response format, auth requirements
  - Include examples with curl
  - Acceptance criteria: every endpoint under `/api/` is documented with at least method, path, and response shape

- [x] **RT-5.5** Add deployment guide
  - File: `docs/DEPLOYMENT.md`
  - Document: Vercel setup, Turso DB creation, environment variables, seed script, cron setup
  - Include the cron-job.org setup steps
  - Acceptance criteria: a new developer could deploy the app from scratch following only this guide

---

## Week 6 — Performance & Polish

- [x] **RT-6.1** Add pagination to properties API
  - File: `src/app/api/properties/route.ts`
  - Accept `?page=1&limit=20` query params
  - Return `{ data: [...], total: N, page: 1, limit: 20 }`
  - Keep backward compatibility: if no pagination params, return all (existing behavior)
  - Acceptance criteria: `?page=1&limit=5` returns first 5 properties with total count

- [x] **RT-6.2** Lazy-load synced events in property calendar
  - File: `src/components/property-calendar.tsx`
  - Only fetch synced events when the calendar component mounts, not on every property selection
  - Add a loading state while events are being fetched
  - Acceptance criteria: switching between properties doesn't trigger unnecessary re-fetches; loading spinner shows

- [x] **RT-6.3** Split property-calendar.tsx into smaller components
  - File: `src/components/property-calendar.tsx` (currently 700+ lines)
  - Extract: `CalendarGrid`, `CalendarLegend`, `CalendarNavigation`, `AgendaList` as separate components
  - Keep all in `src/components/calendar/` directory
  - Acceptance criteria: property-calendar.tsx is under 200 lines; all extracted components work correctly

- [x] **RT-6.4** Add mobile-responsive layout
  - Files: `src/components/top-bar.tsx`, `src/app/page.tsx`
  - Add hamburger menu for mobile (hide full nav, show drawer)
  - Make calendar grid scroll horizontally on small screens
  - Make guest cards stack single-column on mobile
  - Acceptance criteria: app is usable on 375px wide viewport; no horizontal scroll on main content

- [x] **RT-6.5** Add PWA manifest for mobile home screen
  - Files: `public/manifest.json`, `src/app/layout.tsx`
  - Add web app manifest with app name, icons, theme color
  - Add `<link rel="manifest">` to layout
  - Acceptance criteria: Chrome shows "Add to Home Screen" option; app opens fullscreen from home screen

---

## Week 7 — Multi-tenancy foundations

> Currently every logged-in user sees ALL properties/reservations. Before sharing the app with anyone else, isolate per user. No payments — just clean data ownership so multiple owners can use the same instance safely.

- [x] **RT-7.1** Add `userId` FK to Property + backfill existing rows to current superadmin
  - File: `prisma/schema.prisma` — add `userId Int` to `Property` with `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  - File: `prisma/push-schema.ts` — add migration `ALTER TABLE "Property" ADD COLUMN "userId" INTEGER NOT NULL DEFAULT 1` then drop the default in a follow-up migration
  - Add reverse relation on `User`: `properties Property[]`
  - Run schema push, verify both existing properties show `userId=1`
  - Acceptance criteria: schema pushes cleanly; existing data intact; new properties require userId

- [x] **RT-7.2** Filter Properties API by current user
  - File: `src/app/api/properties/route.ts` (GET) — use `getSession()` from `lib/auth.ts` to get userId, filter `where: { userId }`
  - File: `src/app/api/properties/route.ts` (POST) — set `userId` from session on create
  - File: `src/app/api/properties/[id]/route.ts` (PATCH/DELETE) — refuse if property's userId != session userId (return 404, not 403, to avoid leaking existence)
  - Acceptance criteria: user A cannot see/modify user B's properties via direct URL or API call

- [x] **RT-7.3** Cascade ownership check to nested resources
  - Files: `src/app/api/reservations/route.ts`, `src/app/api/reservations/[id]/route.ts`, `src/app/api/guests/route.ts`, `src/app/api/guests/[id]/route.ts`, `src/app/api/calendar/links/route.ts`, `src/app/api/calendar/links/[id]/route.ts`, `src/app/api/calendar/sync/route.ts`, `src/app/api/date-overrides/route.ts`
  - Pattern: load the parent Property; verify `property.userId === session.userId`; reject otherwise
  - Acceptance criteria: every nested API endpoint enforces ownership via the property chain

- [ ] **RT-7.4** Public iCal feed token (rotatable per property)
  Blocked: enforces 404 on tokenless feed URLs — breaks live Airbnb/Booking.com fetches; needs user-driven cutover plan.
  - File: `prisma/schema.prisma` — add `feedToken String @unique @default(cuid())` to Property (or generate via push-schema migration)
  - File: `src/app/api/calendar/feed/[propertyId]/[filename]/route.ts` — accept `?token=` query param, validate against `property.feedToken`; return 404 if missing/wrong
  - File: `src/components/sync-settings.tsx` — show feed URL with token; "Rotate token" button that POSTs to `/api/calendar/links/rotate-token`
  - File: `src/app/api/properties/[id]/rotate-feed-token/route.ts` (new) — generates new token, updates property
  - Acceptance criteria: feed URL with wrong/no token returns 404; rotating token invalidates old URL

- [x] **RT-7.5** Public signup endpoint + UI
  - File: `src/app/api/auth/signup/route.ts` (new) — accept username + password, validate (min 3 chars username, min 8 chars password), refuse if username exists, hash password with bcrypt, create user with role="user", create session
  - File: `src/app/signup/page.tsx` (new) — form mirroring login page
  - File: `src/app/login/page.tsx` — add "Don't have an account? Sign up" link
  - File: `src/middleware.ts` — add `/signup` and `/api/auth/signup` to `PUBLIC_PATHS`
  - Acceptance criteria: anyone can create an account; new accounts see empty dashboard; old accounts unaffected

---

## Week 8 — Onboarding & first-run experience

> A new user lands and sees... nothing. Make the first 60 seconds productive.

- [x] **RT-8.1** Welcome modal on first login (when user has zero properties)
  - File: `src/components/welcome-modal.tsx` (new) — friendly modal: "Welcome! Let's get started." with two CTAs: "Add my first property" and "Use a sample property"
  - File: `src/components/dashboard.tsx` — show modal when `properties.length === 0`
  - Persist dismissal in localStorage so it doesn't show again after first dismiss
  - Acceptance criteria: new user sees welcome on first login; dismissing it doesn't reappear

- [x] **RT-8.2** Sample property generator
  - File: `src/app/api/properties/sample/route.ts` (new) — POST creates a property "Sample Apartment" with realistic settings (minNights=2, buffers=0, checkInTime=15:00, checkOutTime=11:00) + 3 mock internal reservations spread across the next 30 days
  - File: `src/components/welcome-modal.tsx` — "Use sample" button calls this endpoint
  - Acceptance criteria: clicking "Use sample" creates a fully-populated demo property the user can explore and delete

- [x] **RT-8.3** Empty-state illustrations on each tab
  - Files: `src/components/property-calendar.tsx`, `src/components/cleaning-schedule.tsx`, `src/components/sync-settings.tsx`
  - When the data array is empty, show a centered card with an SVG icon, a one-line explainer, and a primary CTA
  - Examples: Calendar empty → "No bookings yet — sync a calendar or add one manually"; Sync settings empty → "Connect Airbnb or Booking.com to start syncing"
  - Acceptance criteria: all main views have helpful empty states instead of blank space

- [x] **RT-8.4** Inline tooltips on first visit to a tab (per-property)
  - File: `src/components/onboarding-tooltips.tsx` (new) — small dismissible tooltip component anchored to a specific element
  - File: `src/components/property-calendar.tsx` — show tooltip on the "Edit Dates" button on first visit: "Click any date to override its status"
  - File: `src/components/sync-settings.tsx` — tooltip on the iCal field: "Paste your Airbnb iCal export URL here"
  - Persist seen-state in localStorage keyed by `tooltip:<id>`
  - Acceptance criteria: each tooltip shows once per browser, then never again

- [x] **RT-8.5** Profile page (change password, see account info)
  - File: `src/app/api/auth/change-password/route.ts` (new) — POST: verify current password, hash new password, update
  - File: `src/components/profile-panel.tsx` (new) — shows username, role, account-created date, change-password form
  - File: `src/components/top-bar.tsx` — add "Profile" entry to user dropdown above logout
  - Acceptance criteria: user can change their own password without admin help

---

## Week 9 — Reliability & observability

> If something breaks, we should know before the user does. If they hit a bug, they should see something useful — not a stack trace.

- [x] **RT-9.1** Structured request logger middleware
  - File: `src/lib/logger.ts` (new) — minimal JSON logger: `log({ level, msg, ...fields })` writes to `console.log` in dev, structured JSON to `console.log` in prod (Vercel collects stdout)
  - File: `src/middleware.ts` — log every request: timestamp, method, path, status, duration ms, userId (if session), ip
  - Acceptance criteria: Vercel logs show one structured line per request; can grep by userId or path

- [x] **RT-9.2** Health endpoint with deeper checks
  - File: `src/app/api/health/route.ts` (new) — returns 200 if: DB ping succeeds, last sync ran in last 2 hours (or returns 503 with details otherwise)
  - Public (no auth) so external uptime monitors can hit it
  - File: `src/middleware.ts` — add `/api/health` to `PUBLIC_PATHS`
  - Acceptance criteria: hitting `/api/health` returns `{ status: "ok", db: "ok", lastSyncMin: 12, version: "<git SHA>" }` or 503 with details

- [ ] **RT-9.3** Sentry error tracking (free tier)
  Blocked: needs interactive @sentry/wizard login + Sentry account + DSN env var; not automatable.
  - Run `npx @sentry/wizard@latest -i nextjs`, accept defaults
  - Add `SENTRY_DSN` to `.env.local` and Vercel env vars
  - Wrap `app/error.tsx` with `Sentry.captureException(error)` call
  - Acceptance criteria: throwing an unhandled error shows up in Sentry within 30 seconds

- [x] **RT-9.4** Sync failure auto-alert
  - File: `src/lib/calendar-sync.ts` — when a `CalendarLink` fails 3 consecutive sync attempts (track in `lastError` + `failureCount`), write a `SyncLog` row with level=error and a clear message
  - File: `src/app/page.tsx` — fetch unread sync alerts on app mount; show a top-of-page banner if any exist
  - Banner has dismiss button that marks alerts as read
  - Acceptance criteria: simulating a failing iCal URL surfaces a banner after 3 cron ticks

- [x] **RT-9.5** Audit log of mutations
  - File: `prisma/schema.prisma` — add `AuditLog { id, userId, action, resourceType, resourceId, payload (JSON string), createdAt }`
  - File: `src/lib/audit.ts` (new) — `logAudit(userId, action, type, id, payload)` helper
  - Call from: create/update/delete property, reservation, guest, override, calendar link
  - File: `src/app/api/audit/route.ts` (new) — GET (auth required) returns last 50 entries for current user
  - File: `src/components/audit-panel.tsx` (new, accessible via Profile) — shows recent activity
  - Acceptance criteria: every mutation logs an entry; user can see their own activity history

---

## Week 10 — Cleaner workflow

> Real properties have real cleaners. Make the cleaning schedule actionable beyond "here's a list of dates."

- [x] **RT-10.1** Cleaner role + simplified login view
  - File: `prisma/schema.prisma` — User role can be "user" | "cleaner" | "superadmin"
  - File: `src/app/page.tsx` — when `user.role === "cleaner"`, render a stripped-down view: only the cleaning schedule across assigned properties, no settings/sync/guests
  - Acceptance criteria: a cleaner-role user sees only cleaning data; cannot navigate to settings or guest details

- [x] **RT-10.2** Cleaner-property assignment
  - File: `prisma/schema.prisma` — add `CleanerAssignment { id, cleanerId User, propertyId Property, createdAt }`
  - File: `src/app/api/cleaner-assignments/route.ts` (new) — owner can assign their own cleaners to their own properties
  - File: `src/components/sync-settings.tsx` — new section "Cleaners" with multi-select of users with role=cleaner
  - File: `src/components/cleaning-schedule.tsx` — when current user is a cleaner, filter to only assigned properties
  - Acceptance criteria: owner can assign 1+ cleaners per property; cleaner sees only those properties

- [x] **RT-10.3** Cleaning status tracking (pending/done/skipped)
  - File: `prisma/schema.prisma` — add `CleaningRecord { id, propertyId, date, status (pending/done/skipped), doneAt, doneByUserId, notes, photos (JSON array of URLs) }`
  - File: `src/components/cleaning-schedule.tsx` — each row shows current status with a button to mark done/skip; persists to a `CleaningRecord`
  - File: `src/app/api/cleaning-records/route.ts` (new)
  - Acceptance criteria: clicking "Done" on a cleaning persists status; refresh shows it as done

- [ ] **RT-10.4** Photo upload for completed cleanings (optional proof)
  Blocked: needs Vercel Blob token provisioned; Vercel filesystem is read-only so dev-only fallback won't survive prod.
  - File: `src/app/api/cleaning-records/[id]/photos/route.ts` (new) — POST accepts files, stores via Vercel Blob (free tier) or local public/uploads in dev
  - File: `src/components/cleaning-schedule.tsx` — when marking done, show optional file picker; thumbnails appear in the row
  - Acceptance criteria: cleaner can attach photos; owner sees thumbnails on the cleaning record

- [x] **RT-10.5** Daily/weekly cleaning summary view
  - File: `src/components/cleaning-summary.tsx` (new) — shows today's cleanings, tomorrow's, this week's; print button (CSS print stylesheet)
  - File: `src/components/property-cleaning-view.tsx` — link to summary at top
  - Acceptance criteria: cleaner can print a paper schedule for the day/week

---

## Week 11 — Guest experience tools

> Things that pay back daily: pre-arrival messages, document libraries, easier guest-to-reservation linking.

- [x] **RT-11.1** Guest message templates per property
  - File: `prisma/schema.prisma` — add `MessageTemplate { id, propertyId, name, language, subject, body, sendOffsetDays (negative=before checkin, positive=after), createdAt }`
  - File: `src/app/api/message-templates/route.ts` (new)
  - File: `src/components/message-templates-panel.tsx` (new, in property Settings tab) — CRUD for templates with variable hints (`{{guestName}}`, `{{checkIn}}`, `{{checkOut}}`, `{{wifiPassword}}`)
  - Acceptance criteria: owner can save templates; preview rendered output with sample variables

- [x] **RT-11.2** Render template button on reservation view
  - File: `src/components/reservation-view.tsx` — "Generate message" dropdown showing available templates; clicking a template renders it with reservation variables filled in; copy-to-clipboard button
  - Acceptance criteria: owner can pick a template, copy the rendered text, paste into Airbnb/WhatsApp

- [ ] **RT-11.3** Property documents tab
  Blocked: needs Vercel Blob token (same as RT-10.4); read-only Vercel FS prevents prod-safe local fallback.
  - File: `prisma/schema.prisma` — add `PropertyDocument { id, propertyId, name, type (pdf/image/text), content/url, createdAt }`
  - File: `src/app/api/property-documents/route.ts` (new) — upload to Vercel Blob, store URL
  - File: `src/components/property-documents-panel.tsx` (new) — accessible as a sub-tab of Settings; list, upload, delete
  - Acceptance criteria: owner can upload house rules PDF, wifi instructions photo; files survive page reload

- [ ] **RT-11.4** Document variable in message templates
  Blocked: depends on RT-11.3 PropertyDocument storage which needs Vercel Blob token.
  - File: `src/components/message-templates-panel.tsx` — variables list includes `{{document:rules}}` style references
  - At render time, replace with public download URL (signed if Vercel Blob, plain URL if dev)
  - Acceptance criteria: rendered template includes working links to property documents

- [x] **RT-11.5** Quick guest search across all properties
  - File: `src/app/api/guests/search/route.ts` (new) — GET `?q=` searches by fullName, passportNumber, country across all guests of properties owned by current user
  - File: `src/components/top-bar.tsx` — add a search input (cmd-K trigger) that opens a results dropdown
  - Acceptance criteria: typing a guest name shows matches across all properties; clicking opens the reservation

---

## Week 12 — Reports, polish, dev experience

> Final pass before declaring "v1." Reports for owners, polish for users, tooling for the next dev.

- [x] **RT-12.1** Occupancy report per property
  - File: `src/components/reports-panel.tsx` (new, accessible from top bar) — bar chart of occupancy % per month for last 12 months
  - Compute: occupied days / total days; consider an "occupied day" any day a bar covers
  - Use a small chart lib (`recharts`) — no heavy DataViz framework
  - Acceptance criteria: chart renders for any property with bookings; tooltip shows exact %

- [ ] **RT-12.2** Reservations export to CSV
  - File: `src/app/api/reservations/export/route.ts` (new) — GET returns CSV (RFC 4180 + BOM, like guest export) of all reservations for owner's properties; filterable by date range
  - File: `src/components/reports-panel.tsx` — "Export reservations CSV" button with date range picker
  - Acceptance criteria: clicking download fetches a CSV opening cleanly in Excel with Cyrillic intact

- [ ] **RT-12.3** Activity feed on dashboard
  - File: `src/components/dashboard.tsx` — section "Recent activity" showing last 10 events: new bookings synced, conflicts detected, manual changes (from AuditLog), sync errors
  - Each item: relative time ("2 hours ago"), icon, summary, click → relevant page
  - Acceptance criteria: dashboard always shows at least the last sync attempt and most recent booking change

- [ ] **RT-12.4** Keyboard shortcuts
  - File: `src/components/keyboard-shortcuts.tsx` (new) — global key handler component mounted in layout
  - Bindings: `←/→` previous/next month in calendar, `T` jump to today, `E` toggle edit dates, `?` show shortcut overlay, `cmd/ctrl+K` open guest search
  - File: shortcut overlay shows all bindings
  - Acceptance criteria: shortcuts work on calendar page; `?` shows the help overlay

- [ ] **RT-12.5** Bulk import reservations from CSV
  - File: `src/app/api/reservations/import/route.ts` (new) — POST CSV (same shape as export); parse, validate each row, return per-row results (created/skipped/error)
  - File: `src/components/reports-panel.tsx` — "Import reservations" button with file picker + dry-run preview
  - Acceptance criteria: importing the CSV from RT-12.2 round-trips cleanly with zero errors

- [ ] **RT-12.6** README + setup guide for new developer
  - File: `README.md` — overhaul: what the app does, screenshots (3-4), tech stack, prerequisites (Node, Turso CLI, Gemini key), 5-minute local setup steps, how to run sync manually, how to deploy
  - File: `docs/CONTRIBUTING.md` (new) — code style rules, branch naming, commit message format (we use Conventional Commits + Co-Authored-By), how to run vitest, how to add a route
  - Acceptance criteria: a new dev cloning the repo can be running locally in under 10 minutes following only the README

- [ ] **RT-12.7** Dependency audit + upgrade
  - Run `npm outdated`, `npm audit`
  - Bump non-breaking patches; for major bumps: read the changelog, do them one-at-a-time with full app smoke test
  - Pin `next`, `react`, `prisma`, `@google/generative-ai` versions explicitly
  - Acceptance criteria: `npm audit` reports 0 high/critical vulns; build still passes

---

## Done log

<!-- Append completed tasks here: -->
<!-- - YYYY-MM-DD — RT-X.X — <short SHA> — <one-line summary> -->
- 2026-05-03 — RT-1.1 — 1008fa3 — NaN validation on 5 dynamic route handlers
- 2026-05-03 — RT-1.2 — ac0251b — wrapped 15 API routes in try-catch
- 2026-05-03 — RT-1.3 — e866e9b — validate reservation checkIn/checkOut on POST
- 2026-05-03 — RT-1.4 — 49cbe7b — confirm() on delete property/reservation/guest (in sidebar.tsx + guest-cards.tsx; delete buttons live there, not in property-calendar/dashboard)
- 2026-05-03 — RT-1.5 — b8bc811 — min 8-char password on user creation
- 2026-05-03 — RT-2.1 — 25c5ae7 — added updatedAt to Property/Reservation/Guest
- 2026-05-03 — RT-2.2 — 45835bc — block overlapping reservations with 409
- 2026-05-03 — RT-2.3 — 1ae5fbf — loading spinners on properties/calendar/dashboard fetches
- 2026-05-03 — RT-2.4 — 4f59297 — guest-name search filter on Dashboard reservations
- 2026-05-03 — RT-2.5 — a1c029d — reservation+guest counts in TopBar property selector
- 2026-05-03 — RT-3.1 — c3acde7 — sync health indicator in PropertyCalendar header
- 2026-05-03 — RT-3.2 — d629741 — Sync Now button next to property name
- 2026-05-03 — RT-3.3 — 0bb2503 — show bar label on day 1 for cross-month bookings
- 2026-05-03 — RT-3.4 — 8f50040 — /api/calendar/health endpoint
- 2026-05-03 — RT-3.5 — d85b3fe — per-property Airbnb/Booking event counts in Tasks panel
- 2026-05-04 — RT-4.1 — efb03d0 — inline edit mode + full-field PATCH for guest cards
- 2026-05-04 — RT-4.2 — e652a5b — sanitize passport (strip spaces) and issuedBy (alphanumeric) on PATCH
- 2026-05-04 — RT-4.3 — ec82d36 — Export CSV button above guest cards (RFC 4180 + BOM)
- 2026-05-04 — RT-4.4 — 62a6ffa — extraction success/failure summary banner with per-file reasons
- 2026-05-04 — RT-4.5 — 25893c0 — compute guest age from DOB at render, fallback to stored yearsOld
- 2026-05-04 — RT-5.1 — 4c18f85 — vitest installed; 14 ical.ts tests passing
- 2026-05-04 — RT-5.2 — d943542 — sanitize lib extracted; 25 tests covering Cyrillic/diacritics/edges
- 2026-05-04 — RT-5.3 — 7e277c9 — 8 new buffer-logic tests (generateBufferedEvents + generateBufferOnlyEvents)
- 2026-05-04 — RT-5.4 — 511bc8d — docs/API.md covering all 23 API route handlers
- 2026-05-04 — RT-5.5 — 313292c — docs/DEPLOYMENT.md (Turso + Vercel + cron-job.org walkthrough)
- 2026-05-04 — RT-6.1 — d1ed057 — properties API pagination via ?page&limit (backward compatible)
- 2026-05-04 — RT-6.2 — c13bc69 — per-property calendar data cache (30s TTL) skips refetch on remount
- 2026-05-04 — RT-6.3 — e793104 — extracted 13 modules under src/components/calendar/; parent file 1175→191 lines
- 2026-05-04 — RT-6.4 — 28f082c — mobile hamburger drawer, calendar horizontal scroll, toolbar wraps under sm
- 2026-05-04 — RT-6.5 — 14bcb92 — manifest.json + icon.svg + appleWebApp metadata; viewport themeColor
- 2026-05-04 — RT-7.1 — 7edeedb — Property.userId FK with index; backfilled both rows to userId=1
- 2026-05-04 — RT-7.2 — 8fca1af — properties API filtered/scoped to session.userId; foreign properties return 404
- 2026-05-04 — RT-7.3 — 4a5b200 — ownership cascade across reservations/guests/calendar links/sync/overrides; nested 404s on foreign access
- 2026-05-04 — RT-7.5 — 949a6f6 — public signup endpoint + page; i18n strings for en/ru; public-paths whitelist updated
- 2026-05-04 — RT-8.1 — 96175fa — welcome modal for empty workspaces; localStorage-persisted dismissal
- 2026-05-04 — RT-8.2 — f841922 — POST /api/properties/sample seeds Sample Apartment + 3 demo reservations
- 2026-05-04 — RT-8.3 — f33a616 — shared EmptyState card on calendar/cleaning/sync; en/ru strings
- 2026-05-04 — RT-8.4 — a60ba89 — OnboardingTooltip on Edit Dates + Airbnb iCal label; localStorage one-shot per id
- 2026-05-04 — RT-8.5 — 15fcbf0 — change-password endpoint + /api/auth/me + ProfilePanel modal accessed from top-bar user dropdown
- 2026-05-04 — RT-9.1 — cb58d62 — JSON request logger emitted from middleware; method/path/status/durationMs/userId/ip per request
- 2026-05-04 — RT-9.2 — a3c88dc — public /api/health endpoint with DB ping + 2h sync-staleness check; returns 503 on failure
- 2026-05-04 — RT-9.4 — 821c53c — CalendarLink.failureCount + alertsDismissedAt watermark; [ALERT] SyncLog rows surfaced via SyncAlertsBanner
- 2026-05-04 — RT-9.5 — 1bd61f2 — AuditLog table + logAudit helper + /api/audit + AuditPanel reachable from Profile
- 2026-05-04 — RT-10.1 — 1bc29e1 — cleaner role short-circuits to CleanerApp with cleaning-only dashboard view
- 2026-05-04 — RT-10.2 — 9f6f5ea — CleanerAssignment table + REST endpoints + SyncSettings panel; cleaner /api/properties scoped via assignments
- 2026-05-04 — RT-10.3 — fe2f0f8 — CleaningRecord table + /api/cleaning-records + done/skipped badges and toggle button in CleaningSchedule
- 2026-05-04 — RT-10.5 — 3ac6a0d — printable Today/Tomorrow/Week cleaning summary modal wired into PropertyCleaningView + CleanerApp
- 2026-05-04 — RT-11.1 — 06347b0 — MessageTemplate table + /api/message-templates + MessageTemplatesPanel with variable preview in SyncSettings
- 2026-05-04 — RT-11.2 — a45e75c — generate-message dropdown on reservation view with rendered preview + copy-to-clipboard
- 2026-05-04 — RT-11.5 — 3654eaf — /api/guests/search + top-bar guest search with Cmd-K shortcut and debounced dropdown
- 2026-05-04 — RT-12.1 — 542fb6b — Reports view with recharts BarChart of last-12-month occupancy per property
