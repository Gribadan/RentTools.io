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

- [x] **RT-12.2** Reservations export to CSV
  - File: `src/app/api/reservations/export/route.ts` (new) — GET returns CSV (RFC 4180 + BOM, like guest export) of all reservations for owner's properties; filterable by date range
  - File: `src/components/reports-panel.tsx` — "Export reservations CSV" button with date range picker
  - Acceptance criteria: clicking download fetches a CSV opening cleanly in Excel with Cyrillic intact

- [x] **RT-12.3** Activity feed on dashboard
  - File: `src/components/dashboard.tsx` — section "Recent activity" showing last 10 events: new bookings synced, conflicts detected, manual changes (from AuditLog), sync errors
  - Each item: relative time ("2 hours ago"), icon, summary, click → relevant page
  - Acceptance criteria: dashboard always shows at least the last sync attempt and most recent booking change

- [x] **RT-12.4** Keyboard shortcuts
  - File: `src/components/keyboard-shortcuts.tsx` (new) — global key handler component mounted in layout
  - Bindings: `←/→` previous/next month in calendar, `T` jump to today, `E` toggle edit dates, `?` show shortcut overlay, `cmd/ctrl+K` open guest search
  - File: shortcut overlay shows all bindings
  - Acceptance criteria: shortcuts work on calendar page; `?` shows the help overlay

- [x] **RT-12.5** Bulk import reservations from CSV
  - File: `src/app/api/reservations/import/route.ts` (new) — POST CSV (same shape as export); parse, validate each row, return per-row results (created/skipped/error)
  - File: `src/components/reports-panel.tsx` — "Import reservations" button with file picker + dry-run preview
  - Acceptance criteria: importing the CSV from RT-12.2 round-trips cleanly with zero errors

- [x] **RT-12.6** README + setup guide for new developer
  - File: `README.md` — overhaul: what the app does, screenshots (3-4), tech stack, prerequisites (Node, Turso CLI, Gemini key), 5-minute local setup steps, how to run sync manually, how to deploy
  - File: `docs/CONTRIBUTING.md` (new) — code style rules, branch naming, commit message format (we use Conventional Commits + Co-Authored-By), how to run vitest, how to add a route
  - Acceptance criteria: a new dev cloning the repo can be running locally in under 10 minutes following only the README

- [x] **RT-12.7** Dependency audit + upgrade
  - Run `npm outdated`, `npm audit`
  - Bump non-breaking patches; for major bumps: read the changelog, do them one-at-a-time with full app smoke test
  - Pin `next`, `react`, `prisma`, `@google/generative-ai` versions explicitly
  - Acceptance criteria: `npm audit` reports 0 high/critical vulns; build still passes

---

## Week 13 — DigitalOcean droplet migration

> Goal: leave Vercel + Turso behind. Run on a single cheap DO droplet
> (Basic $4–6/mo, 1 vCPU, 1 GB RAM) with a self-hosted SQLite database
> on the same machine. Native cron instead of cron-job.org.
>
> Plan: stand up the droplet alongside the live Vercel deployment,
> migrate data with both running, test on a subdomain, then DNS-cutover.
> No data loss, instant rollback by flipping DNS back.

- [x] **RT-13.1** Public-repo secret audit — final pass
  - Run `git log -p --all | rg -i "(eyJ[A-Za-z0-9]{20}|libsql://[a-z0-9.-]+\.turso\.io|AIza[A-Za-z0-9_-]{30,}|admin\.booking\.com/.*\?|airbnb\.[^/]+/calendar/ical/[0-9]+\.ics)"` — **must return zero hits** before flipping the repo to public
  - If any historical commit contains a secret: rotate that secret BEFORE making the repo public; rewriting history with `git filter-repo` is optional but rotation is mandatory
  - Acceptance criteria: clean grep; rotated any leaked credentials; the repo settings page can be flipped to public without leaking active secrets

- [x] **RT-13.2** Documented runbook for the droplet
  - File: `docs/DROPLET-SETUP.md` (new) — step-by-step provisioning runbook covering: choose droplet ($6 Basic, Ubuntu 24.04 LTS, NYC3 or closest), set hostname, harden (root pw → key auth, disable password auth, ufw allow 22/80/443, install fail2ban, create non-root `app` user with sudo)
  - Add: enable 2 GB swap (RAM is tight on 1 GB; build needs headroom): `fallocate -l 2G /swapfile; chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile; echo '/swapfile none swap sw 0 0' >> /etc/fstab`
  - Acceptance criteria: a fresh Ubuntu droplet can be brought to "ready for app deploy" by following the runbook top-to-bottom in under 30 minutes

- [x] **RT-13.3** App user + Node + nginx install script  *(server-bootstrap.sh done; server-deploy.sh deferred to RT-13.13)*
  - File: `scripts/server-bootstrap.sh` (new, runs as root on droplet) — installs Node 22 LTS via NodeSource, installs nginx, certbot (snap or apt), git; creates `app` user with home `/home/app` and adds `~/.ssh/authorized_keys` from a template
  - File: `scripts/server-deploy.sh` (new, runs as `app`) — clones the repo to `/home/app/rent-tool`, runs `npm ci --omit=dev`, `npx prisma generate`, `npm run build`
  - Document in DROPLET-SETUP.md the commands to run each script
  - Acceptance criteria: running both scripts leaves you with a working `npm start` that serves the app on `localhost:3000`

- [x] **RT-13.4** systemd service for the Next.js app
  - File: `deploy/systemd/rent-tool.service` (new) — Type=simple, User=app, WorkingDirectory=/home/app/rent-tool, ExecStart=/usr/bin/node ./node_modules/.bin/next start -p 3000, Restart=always, EnvironmentFile=/home/app/rent-tool/.env.production
  - Document: copy to `/etc/systemd/system/`, `systemctl daemon-reload`, `enable --now`, `status` to verify
  - Acceptance criteria: rebooting the droplet brings the app back up automatically; `journalctl -u rent-tool -f` streams app logs

- [x] **RT-13.5** nginx reverse proxy config + TLS  *(file delivered; cert issued via DNS-01 + Cloudflare; on-droplet install is part of RT-13.11 cutover)*
  - File: `deploy/nginx/rent-tool.conf` (new) — server_name renttools.io / www / staging, TLS termination at origin, X-Forwarded-* headers, CF-Connecting-IP for real client IP behind CF proxy, client_max_body_size 20M
  - TLS: Let's Encrypt cert issued via certbot DNS-01 challenge using `certbot-dns-cloudflare` plugin (works through CF proxy without disabling it). Cert covers `renttools.io`, `www.renttools.io`, `staging.renttools.io`, expires 2026-08-02, auto-renews via systemd timer.
  - Cloudflare: SSL/TLS mode = "Full (strict)", always_use_https = on, all 3 A records proxied
  - Acceptance criteria: visiting the bare domain serves the app over HTTPS with an auto-renewing Let's Encrypt cert

- [x] **RT-13.6** Database file path + Prisma config for self-hosted SQLite
  - Files: `prisma/schema.prisma`, `prisma/prisma.config.ts`
  - Add support for a `DATABASE_URL=file:./data/prod.db` mode that uses local libSQL (still via @prisma/adapter-libsql so Prisma client unchanged) — falls back to Turso if `TURSO_DATABASE_URL` is set
  - File: `src/lib/prisma.ts` — pick adapter based on which env var is set
  - File: `prisma/push-schema.ts` — works against either; document calling pattern for both
  - Acceptance criteria: setting `DATABASE_URL=file:./data/prod.db` and unsetting Turso vars makes the app run against a local file; setting Turso vars uses Turso; both pass a smoke test

- [x] **RT-13.7** Data migration script (Turso → local SQLite)  *(script delivered; running it on the droplet is part of cutover)*
  - File: `scripts/migrate-turso-to-local.ts` (new) — connects to both, copies all tables in dependency order: User, Property, CalendarLink, CalendarEvent, Reservation, Guest, DateOverride, MessageTemplate, CleanerAssignment, CleaningRecord, PropertyManager, PropertyManagerInvite, AuditLog, ExtractionLog, SiteSetting, AppSettings, SyncLog
  - For each: full table dump from Turso → insert into local with original IDs preserved (uses `prisma.$executeRaw` so autoincrement is bypassed)
  - Run twice: a dry run reports counts; the real run with `--write` flag actually writes
  - Verify post-migration: row counts match per table; pick 3 properties, deep-compare their reservations + guests + overrides
  - Acceptance criteria: dry run shows N rows per table; real run produces a local DB with identical content; smoke test on the droplet against the migrated DB passes

- [x] **RT-13.8** Native cron for calendar sync  *(files delivered; on-droplet `crontab -u app` install is part of RT-13.11 cutover)*
  - File: `deploy/cron/rent-tool.cron` (new) — `*/10 * * * * curl -fsS -m 30 "http://127.0.0.1:3000/api/calendar/cron?secret=$CRON_SECRET" >> /var/log/rent-tool-cron.log 2>&1` (read CRON_SECRET from a sourced file, not inline)
  - Document install: `crontab -u app -e`, paste, save; tail the log to verify the first run
  - Acceptance criteria: every 10 minutes a sync runs; `SyncLog` table accumulates rows; failed runs leave a clear message in the cron log

- [x] **RT-13.9** Daily backup script  *(files delivered + restore docs; on-droplet enable + restore test bundled with RT-13.11 cutover)*
  - File: `scripts/backup-db.sh` (new) — `sqlite3 /home/app/rent-tool/data/prod.db ".backup /home/app/backups/prod-$(date +%Y%m%d-%H%M).db"`; rotate: keep last 14 daily, last 8 weekly, last 6 monthly via a small bash retention block
  - Cron: `15 3 * * * /home/app/rent-tool/scripts/backup-db.sh`
  - Test restore: copy a backup over the live DB on a staging copy of the droplet, confirm app comes up cleanly against it
  - Acceptance criteria: backups appear under `/home/app/backups/`; old ones are pruned; a documented restore procedure has been tested at least once

- [ ] **RT-13.10** Public-facing health endpoint behind nginx
  Blocked: nginx block live (1ca4999); uptime-monitor signup needs interactive email registration.
  - File: `deploy/nginx/rent-tool.conf` — add `location = /api/health` block with a 5s timeout so monitoring can hit it without going through the proxy timeout
  - Free uptime monitor: register the URL on uptime.com or BetterStack free tier; alert if 3 consecutive checks fail
  - Acceptance criteria: hitting `https://your-domain.com/api/health` returns 200 ok; an artificially-killed service triggers the monitor within 5 minutes

- [ ] **RT-13.11** Stage on subdomain + cutover
  Blocked: requires user-driven DNS edits + manual 30-item smoke test in a low-traffic window.
  - DNS: point `staging.your-domain.com` at the droplet IP (still keep the apex pointing at Vercel)
  - Smoke test on `staging.`: log in, verify all properties + bookings + cleanings + guests appear, generate a manager invite, accept it from another browser, edit a reservation, run a manual sync, hit the calendar feed URL
  - Once green, swap DNS: apex `@` and `www` → droplet IP; lower TTL to 60s a day before to reduce cutover delay
  - Acceptance criteria: staging passes a 30-item checklist; production DNS swap is completed during a low-traffic window; old Vercel URL still serves (rollback ready) for 7 days before being decommissioned

- [ ] **RT-13.12** Decommission Vercel + Turso
  Blocked: depends on RT-13.11 cutover + 7-day clean-operation window before code/docs can drop Vercel references.
  - Remove the GitHub → Vercel integration so future pushes don't trigger Vercel builds
  - Export Turso data one final time as a safety backup (`turso db shell <db> .dump > final-backup.sql`), store in `.local/`
  - After 7 days of clean operation on the droplet: delete the Vercel project and the Turso database
  - Update README with the new architecture; remove now-obsolete `vercel.json` and any Vercel-specific code paths
  - Acceptance criteria: no traffic hits Vercel for 24 hours straight; Turso DB is exported then deleted; nothing in the repo references the old hosting

- [x] **RT-13.13** Auto-deploy on push (replaces Vercel auto-deploy)  *(files delivered + workflow gated on `vars.DROPLET_HOST` so it's inert until secrets land; SSH key + repo secrets/vars are user-side setup per docs/DROPLET-SETUP.md §10)*
  - File: `scripts/deploy.sh` (new, runs on droplet as `app`) — `git pull`, `npm ci --omit=dev`, `npx prisma generate`, `npm run build`, `sudo systemctl restart rent-tool`
  - File: `.github/workflows/deploy.yml` (new) — on push to master: SSH to droplet, run `~/rent-tool/scripts/deploy.sh`; uses a deploy SSH key stored in `secrets.DEPLOY_KEY` (GitHub repo secret), host fingerprint pinned
  - Document the GitHub secret setup: generate keypair (`ssh-keygen -t ed25519 -f droplet_deploy`), add `.pub` to droplet's `~/.ssh/authorized_keys`, add private key as `DEPLOY_KEY` repo secret, add `DROPLET_HOST` and `DROPLET_USER` repo variables
  - Acceptance criteria: pushing to master triggers a successful deploy in under 3 minutes; failing builds don't kill the running service (deploy.sh aborts on failure before the systemctl restart)

- [x] **RT-13.14** Resource sanity check + alerting  *(script + cron line + DROPLET-SETUP §11 baseline delivered; on-droplet `apt install htop/iotop/vnstat`, Telegram bot wiring, and forced-breach smoke test bundled with RT-13.11 cutover)*
  - On the droplet: install `htop`, `iotop`, `vnstat`; confirm steady-state RAM is under 600 MB and CPU under 20%
  - Add a small `scripts/check-resources.sh` that posts a warning to an email-via-Mailgun-free / Telegram bot if RAM > 90% or disk > 80%
  - Run hourly via cron
  - Acceptance criteria: alert fires when you intentionally fill /tmp; resource baseline is documented in `docs/DROPLET-SETUP.md`

- [x] **RT-13.15** Update routine prompt for new ops
  - File: `.routines/ROUTINE.md` — keep as-is for code tasks
  - Add a separate `.routines/OPS-ROUTINE.md` for ops checks: every-week loop that checks backup integrity, looks for failing crons, checks disk usage trend
  - Acceptance criteria: the ops routine can run end-to-end and produce a one-paragraph status report

---

## Week 14 — Public open-source release

> Goal: make the GitHub repo public so people with the same property-management pain can use it. Position as "open-source AND free at the owner's hosted instance." This is the polish week: README, license, landing page, marketing copy.

- [x] **RT-14.1** Comprehensive README rewrite
  - File: `README.md`
  - Top section: tagline ("Self-host your Airbnb + Booking.com calendar, cleaning schedule, and guest documents — or use it free at <our-domain>"), 3 screenshots (calendar, cleaning schedule, guest cards), badges (license, build status if any)
  - Sections: What it does, Free hosted version (link), Self-host (5-min quickstart pointing at docs/DEPLOYMENT.md and docs/DROPLET-SETUP.md), Features (bullet list with checkboxes for what exists), Roadmap (link to .routines/TASKS.md), Tech stack, Contributing (link to docs/CONTRIBUTING.md), License
  - Acceptance criteria: a developer who has never seen the project can decide in 60 seconds whether to self-host or use the hosted version, and find the next step

- [x] **RT-14.2** Add LICENSE file
  - File: `LICENSE` (new) — MIT (recommended for max adoption; allows commercial use with attribution)
  - Update `package.json`: `"license": "MIT"`
  - Acceptance criteria: GitHub recognizes the license in the repo banner

- [x] **RT-14.3** Public landing page at `/`
  - File: `src/app/page.tsx` — currently redirects to login or shows dashboard. Refactor: create a separate `src/app/(app)/dashboard/page.tsx` that's the authenticated view, and make `/` a marketing landing page when the user is NOT logged in
  - Landing content: hero with tagline, 3 feature cards (calendar sync, cleaning automation, guest docs), screenshots, "Sign up free" CTA → `/signup`, "View source on GitHub" CTA, footer with links to repo, ToS, privacy
  - Logged-in users hitting `/` should redirect to the dashboard
  - Acceptance criteria: anonymous visitor sees marketing page; logged-in visitor sees dashboard; mobile layout works at 375px

- [x] **RT-14.4** Open Graph + meta tags for sharing
  - File: `src/app/layout.tsx` — add OG title, OG description, OG image (a 1200x630 banner from `/public/og.png` — generate via screenshotting the calendar with a custom overlay), Twitter card meta
  - Add `<meta name="theme-color">`, `<link rel="canonical">`
  - File: `public/og.png` (new) — actual image (placeholder is fine to start)
  - Acceptance criteria: pasting the URL into Twitter/Slack/Telegram shows a rich card preview

- [x] **RT-14.5** Robots, sitemap, terms, privacy
  - File: `public/robots.txt` — already exists, verify content
  - File: `src/app/sitemap.ts` (new, Next 16 conventions) — list `/`, `/signup`, `/login`, `/terms`, `/privacy`
  - File: `src/app/terms/page.tsx` (new) — minimal ToS markdown rendered statically. Cover: free service, no warranty, no liability, user owns their data, owner reserves right to suspend abuse
  - File: `src/app/privacy/page.tsx` (new) — what data is collected (email/username, properties, bookings synced from platforms, guest passport data), where it's stored (DO droplet, Vercel/Turso during migration), retention policy, how to export/delete account
  - Footer link to both from the landing page and from inside the app
  - Acceptance criteria: pages load with reasonable text; no lorem ipsum; passes a basic GDPR-readiness review

- [x] **RT-14.6** CONTRIBUTING.md update
  - File: `docs/CONTRIBUTING.md` — already exists; review and update for the public-repo audience
  - Add: how to file an issue (template if useful), how to set up locally (link DEPLOYMENT.md), our commit message convention (Conventional Commits + Co-Authored-By if AI-paired), code-of-conduct lite
  - File: `.github/ISSUE_TEMPLATE/bug.md` and `.github/ISSUE_TEMPLATE/feature.md` (new) — minimal templates
  - Acceptance criteria: a first-time contributor can clone, run locally, find an issue, and submit a useful PR

- [x] **RT-14.7** Showcase / testimonials section (placeholder)
  - File: `src/app/page.tsx` — landing page section "Used by …" with a placeholder for future logos / quotes; don't ship fake testimonials
  - For now: "Built by a real owner of 2 properties tired of juggling 4 calendar tabs"
  - Acceptance criteria: section is honest and removable when real users appear

- [x] **RT-14.8** Make the repo public-flip-safe (CI sanity check)
  - File: `.github/workflows/ci.yml` (new or extended) — on every PR: `npm ci`, `npx next build`, `npx vitest run`. No secrets needed because the build doesn't contact Turso/Gemini at compile time
  - Document in CONTRIBUTING.md that PRs need a green CI before review
  - Acceptance criteria: opening a PR triggers CI; the badge shows green on master; the failure path produces a clear error

---

## Week 15 — Admin panel & free-hosting protections

> Goal: give the owner (you) a single place to control site-wide settings without SSHing in. Make sure the free public hosting can't be ruined by abuse — rate limits, signup gates, opt-in moderation knobs.

- [x] **RT-15.1** Add `SiteSetting` table for global key-value config
  - File: `prisma/schema.prisma` — `model SiteSetting { id Int @id @default(autoincrement()); key String @unique; value String; updatedAt DateTime? }`
  - File: `prisma/push-schema.ts` — additive migration with idempotent CREATE
  - Seed initial keys (only if missing): `signup_enabled` (default "true"), `extraction_per_user_daily_limit` (default "20"), `landing_announcement` (default ""), `support_email` (default ""), `terms_text` and `privacy_text` (defaults from the static pages of RT-14.5 — but stored in DB so admin can edit)
  - File: `src/lib/site-settings.ts` (new) — `getSetting(key, fallback)` and `setSetting(key, value)` helpers; small in-memory cache with 60s TTL to avoid hitting the DB on every request
  - Acceptance criteria: schema pushes cleanly; helpers work; default values appear when DB is empty

- [x] **RT-15.2** Admin-only middleware guard
  - File: `src/lib/auth.ts` — add `requireSuperadmin()` helper that throws/returns 403 if session.role !== "superadmin"
  - File: `src/app/api/admin/*` (new path namespace) — every route under `/api/admin/` calls `requireSuperadmin()` first
  - Acceptance criteria: a regular user hitting `/api/admin/anything` returns 403; superadmin gets through

- [x] **RT-15.3** Admin panel UI (Settings tab → "Admin" subsection, superadmin only)
  - File: `src/components/admin-panel.tsx` (new)
  - File: `src/components/settings-panel.tsx` — when `userRole === "superadmin"`, render `<AdminPanel />` below the existing settings sections; hide entirely for non-admins
  - Sections: Site settings (toggle signup, support email, landing announcement banner), User management (existing), Extraction quota (the daily-limit setting from RT-15.1), System status (links to /api/health, /api/calendar/health), Data export (button to download a full JSON dump of the owner's own data — useful for backups and trust)
  - Acceptance criteria: a regular user sees no admin section; superadmin sees the panel and can change all SiteSettings live; changes take effect within 60s (cache TTL)

- [x] **RT-15.4** Signup toggle gate
  - File: `src/app/api/auth/signup/route.ts` — check `getSetting("signup_enabled", "true")`. If "false", return 403 "Signups are temporarily disabled"
  - File: `src/app/signup/page.tsx` — fetch `/api/site-config` (new public endpoint returning a SAFE subset of settings) on mount; if signup disabled, show a friendly notice and hide the form
  - File: `src/app/api/site-config/route.ts` (new, PUBLIC) — returns only the public-safe keys: signup_enabled, landing_announcement, support_email
  - Acceptance criteria: toggling signup off in admin panel makes the signup page show "disabled" within 60s; toggling back on restores it

- [x] **RT-15.5** Per-user daily extraction rate limit
  - File: `src/app/api/extract/route.ts` — before processing files, count how many AuditLog (or new ExtractionLog) entries the user has from the last 24h. If >= `extraction_per_user_daily_limit`, return 429 "Daily limit reached, try again tomorrow"
  - File: `prisma/schema.prisma` — add `ExtractionLog { id, userId, fileCount, success, createdAt }` so we can count without polluting AuditLog
  - File: extraction route — write one ExtractionLog row per request
  - Acceptance criteria: a user who has done 20 extractions in 24h gets 429; 1 hour later (when oldest extraction ages out), the next attempt works again

- [x] **RT-15.6** Site-wide announcement banner
  - File: `src/app/(app)/layout.tsx` (or wherever the authenticated layout is after RT-14.3) — fetch `landing_announcement` from `/api/site-config`; if non-empty, render a dismissible banner above the top bar
  - Dismissal stored in localStorage keyed by content hash so a NEW announcement re-shows
  - Acceptance criteria: setting an announcement in admin panel makes it appear for all logged-in users; dismissing hides it; changing the announcement re-shows it

- [x] **RT-15.7** Account deletion (GDPR)
  - File: `src/app/api/auth/delete-account/route.ts` (new) — POST: requires current password confirmation; cascades delete the user and ALL their data (Property cascades cover Reservation/Guest/etc.); irreversible
  - File: `src/components/profile-panel.tsx` — "Delete account" red button at bottom; opens a confirmation modal that requires typing the username to confirm
  - File: `docs/PRIVACY.md` (or `src/app/privacy/page.tsx` from RT-14.5) — document the deletion path
  - Acceptance criteria: a user can delete their account end-to-end; verifying with the DB shows zero rows tied to that userId

- [ ] **RT-15.8** Account data export (GDPR)
  - File: `src/app/api/auth/export-data/route.ts` (new) — GET: returns a JSON dump of everything tied to the current user (properties, reservations, guests, overrides, message templates, audit log, cleaning records, manager grants given/received)
  - File: `src/components/profile-panel.tsx` — "Download my data" button
  - Acceptance criteria: clicking the button downloads a usable JSON file; admin panel from RT-15.3 has the same button for the admin's own data

- [ ] **RT-15.9** Email contact (no email infra needed yet — just `mailto:`)
  - File: `src/components/admin-panel.tsx` — `support_email` setting populates a `mailto:` link in the footer of every page
  - File: `src/app/(app)/layout.tsx` — footer shows "Need help? <support_email>" when set
  - Defer: actual SMTP / Resend integration — not needed for free tier; users emailing the owner directly is fine until traffic justifies automated email
  - Acceptance criteria: setting the email in admin panel makes the mailto link appear in the footer

- [ ] **RT-15.10** Admin: per-user usage view
  - File: `src/components/admin-panel.tsx` — "Users" section: table of all users with columns: username, role, signup date, # properties, # reservations, # extractions in last 30d, last login (if tracked — add to schema if not)
  - File: `src/app/api/admin/users/route.ts` (new) — superadmin-only GET that returns the aggregated data
  - File: `prisma/schema.prisma` — add `User.lastLoginAt DateTime?` if not already present; update on successful login
  - Acceptance criteria: admin can spot heavy users / dormant accounts; sortable by any column

- [ ] **RT-15.11** Admin: kill switch on a user (suspend/unsuspend)
  - File: `prisma/schema.prisma` — `User.suspendedAt DateTime?`; nullable
  - File: `src/lib/auth.ts` — login refuses suspended users with a clear message; existing sessions are cleared on next request
  - File: `src/components/admin-panel.tsx` — suspend / unsuspend buttons in the per-user row
  - Acceptance criteria: suspending a user immediately blocks new logins; unsuspending lets them back in

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
- 2026-05-04 — RT-12.2 — 950a10f — /api/reservations/export CSV (BOM) + Reports panel date-range picker
- 2026-05-04 — RT-12.3 — a1d390d — Recent Activity feed (audit+sync merged, /api/activity) on dashboard
- 2026-05-04 — RT-12.4 — 28694c6 — Global ? overlay + calendar arrow/T/E shortcuts (Cmd+K already wired in top-bar)
- 2026-05-04 — RT-12.5 — 3735179 — /api/reservations/import (dry-run + commit) + Reports panel CSV import UI
- 2026-05-04 — RT-12.6 — a3cf903 — README rewrite (5-step Turso setup) + docs/CONTRIBUTING.md (no screenshots)
- 2026-05-04 — RT-12.7 — da3d132 — Pin next 16.2.4/react/prisma/gemini; clears high-severity Next CVE; 0 high/critical
- 2026-05-04 — RT-13.2 — pending — docs/DROPLET-SETUP.md complete provisioning runbook + troubleshooting
- 2026-05-04 — RT-13.3 — pending — scripts/server-bootstrap.sh idempotent root install (swap, ufw, fail2ban, Node 22, nginx, certbot, app user); ran successfully on 64.226.83.37; server-deploy.sh deferred to RT-13.13
- 2026-05-04 — RT-13.1 — cc07fc0 — secret-pattern grep across full git history returns 3 false positives only (env example, doc placeholder, lockfile integrity hash); no real credentials in history; safe to flip repo public
- 2026-05-04 — RT-13.8 — 845a122 — deploy/cron/rent-tool.cron + scripts/cron-sync.sh wrapper (sources CRON_SECRET from .env.production) + DROPLET-SETUP.md §6 with chmod/install/logrotate steps; on-droplet `crontab -u app` install bundled with RT-13.11 cutover
- 2026-05-04 — RT-13.9 — 43204e3 — backup-db.sh (sqlite3 .backup + integrity_check + tiered hardlink retention 14/8/6) + 03:15 cron line + DROPLET-SETUP.md §7 install + restore procedure
- 2026-05-04 — RT-13.13 — e10a57e — scripts/deploy.sh (dirty-check + build-before-restart + health smoke-test) + .github/workflows/deploy.yml (gated on vars.DROPLET_HOST so inert until secrets land) + DROPLET-SETUP.md §10 keypair/sudoers/secrets walkthrough
- 2026-05-04 — RT-13.14 — a31fe34 — scripts/check-resources.sh hourly RAM/disk threshold check (Telegram + webhook fan-out, log-only fallback so safe before alert sink wired) + cron line + DROPLET-SETUP.md §11 baseline + smoke-test command
- 2026-05-04 — RT-13.15 — 75669cd — .routines/OPS-ROUTINE.md read-only weekly checklist (service/health/cron/backup-integrity/disk/RAM/cert) with fixed under-12-line report format; ROUTINE.md unchanged
- 2026-05-04 — RT-13.4 — ee63b45 — deploy/systemd/rent-tool.service unit (Type=simple, User=app, MemoryMax=900M, hardening flags, EnvironmentFile=.env.production); deployed to droplet, active
- 2026-05-04 — RT-13.5 — ee63b45 — deploy/nginx/rent-tool.conf with TLS, CF-Connecting-IP real-IP, HTTP→HTTPS redirect; Let's Encrypt cert issued via DNS-01 with certbot-dns-cloudflare plugin (covers renttools.io / www / staging, expires 2026-08-02, auto-renews); CF proxied + Full (strict) SSL mode + always_use_https=on
- 2026-05-04 — RT-13.6 — a730ecc — src/lib/prisma.ts and prisma/push-schema.ts both auto-detect DATABASE_URL=file:... (local SQLite) vs TURSO_DATABASE_URL (cloud); same @prisma/adapter-libsql path for both
- 2026-05-04 — RT-13.7 — ee63b45 — scripts/migrate-turso-to-local.ts runs in dry-run + --write modes, copies all 17 tables in topological order preserving IDs; ran successfully on droplet: 2 users, 2 properties, 9 reservations, 23 guests, 24 calendar events, 502 sync logs all OK
- 2026-05-04 — RT-14.1 — f4ff93c — README rewrite for public audience: tagline, badges, hosted-version CTA (renttools.io), 5-min self-host quickstart, feature checkboxes, project layout, MIT license reference
- 2026-05-04 — RT-14.2 — 83142c5 — MIT LICENSE file (copyright 2026 Gribadan) + "license": "MIT" in package.json
- 2026-05-04 — RT-14.3 — 3c4da59 — server-component landing at /, dashboard moved to /dashboard, getSession redirect for logged-in users, middleware exact-match for "/", default safeNext flipped from "/" to "/dashboard" across login/signup/invite
- 2026-05-04 — RT-14.4 — cd0bf2d — Metadata API: openGraph + twitter card + canonical + metadataBase https://renttools.io; dynamic 1200x630 OG image via next/og ImageResponse at app/opengraph-image.tsx (no static png needed); robots index/follow
- 2026-05-04 — RT-14.5 — 0e9766f — robots.txt sitemap → renttools.io; app/sitemap.ts emits 5 entries; /terms (9 sections) + /privacy (GDPR data inventory, retention, controller/processor split for guest passport data); middleware whitelists /terms /privacy
- 2026-05-04 — RT-14.6 — 44ed2f8 — CONTRIBUTING.md refreshed for public audience (filing-an-issue section, local setup link, post-/dashboard route layout, code-of-conduct lite no-real-guest-data clause); .github/ISSUE_TEMPLATE/bug.md + feature.md
- 2026-05-04 — RT-14.7 — 5937cb9 — landing "Used by" placeholder: honest eyebrow + maintainer origin line + explicit no-fake-testimonials note; section easily removable when real users appear
- 2026-05-04 — RT-14.8 — 6666e46 — CI workflow at .github/workflows/ci.yml (npm ci + next build + vitest run on push/PR), hermetic with placeholder DATABASE_URL/JWT_SECRET so no real secrets needed; CI status badge in README; CONTRIBUTING.md CI section
- 2026-05-04 — RT-15.1 — d11f496 — SiteSetting table {key, value, updatedAt?} + push-schema migration with 4 seeded defaults (signup_enabled, extraction_per_user_daily_limit, landing_announcement, support_email); src/lib/site-settings.ts with getSetting/setSetting + 60s in-process cache; verified against Turso
- 2026-05-04 — RT-15.2 — 2b4f526 — requireSuperadmin() helper in src/lib/auth.ts (returns {session,response} discriminated union — 401 if unauth, 403 if non-superadmin) + middleware-level boundary guard for /api/admin/* (extracts role from JWT payload, returns 403 before any route resolves) so even non-existent admin paths are gated
- 2026-05-04 — RT-15.3 — 5b221db — AdminPanel component (Site settings editor for 4 whitelisted keys via setSetting() so 60s cache invalidates, System status links to /api/health + /api/calendar/health, Data export button hitting /api/admin/export-my-data); rendered below existing settings sections only when userRole === "superadmin"; new /api/admin/site-settings (GET/PUT, key whitelist + per-key validation) and /api/admin/export-my-data (Content-Disposition JSON dump of caller's properties + reservations + guests + calendar links + templates + cleaning records) — both via requireSuperadmin() and middleware-gated
- 2026-05-04 — RT-15.4 — fb6f10b — signup gate: /api/auth/signup checks signup_enabled (default "true") via getSetting() and returns 403 "Signups are temporarily disabled" when "false"; new public /api/site-config returns {signup_enabled:bool, landing_announcement, support_email}; middleware PUBLIC_PATHS extended; src/app/signup/page.tsx fetches /api/site-config on mount and renders "temporarily disabled" panel with mailto:support_email instead of the form when disabled
- 2026-05-04 — RT-15.5 — 06b1793 — ExtractionLog model {userId, fileCount, success, createdAt} + (userId, createdAt) index; push-schema.ts idempotent migration pushed to Turso (verified queryable); /api/extract reads extraction_per_user_daily_limit (default 20, 0 disables) and counts last-24h ExtractionLog rows before Gemini call → returns 429 with {limit, usedInLast24h} when at cap; writes one log row per request (success=true happy path / success=false in catch) so failures still count against quota
- 2026-05-04 — RT-15.6 — 18c77dc — AnnouncementBanner client component (fetches /api/site-config, renders dismissible blue banner when landing_announcement non-empty, dismissal keyed by FNV-1a hash of text in localStorage so editing the announcement re-shows it); wired into both authenticated shells: src/app/dashboard/page.tsx (above TopBar) and src/components/cleaner-app.tsx (above cleaner header)
- 2026-05-04 — RT-15.7 — 94dd0f4 — GDPR delete: /api/auth/delete-account (POST, requires {password, confirmUsername}; refuses last-superadmin to prevent lockout; explicit deleteMany on ExtractionLog + AuditLog since neither FKs User, then prisma.user.delete relies on cascades for Property tree; clearSession() at end); ProfilePanel "Danger zone" with red modal requiring re-typed username + password (submit disabled until both correct), hard-redirects to /login on success; privacy page Deletion bullet rewritten to match reality (immediate, full data scope, 6-month backup tail)
