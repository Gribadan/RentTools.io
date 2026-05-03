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

- [ ] **RT-3.2** Add "Sync Now" button to property calendar
  - File: `src/components/property-calendar.tsx`
  - Add a refresh icon button next to the property name
  - Clicking triggers POST `/api/calendar/sync`, shows spinner, then refetches events
  - Acceptance criteria: button triggers sync; spinner shows during sync; calendar updates after

- [ ] **RT-3.3** Fix calendar bar rendering for multi-month bookings
  - File: `src/components/property-calendar.tsx`
  - Test: navigate to a month where a booking starts in a previous month (e.g., Oct booking starting Sep)
  - Ensure the bar renders from day 1 of the month, not missing
  - Ensure the bar label shows on the first visible day
  - Acceptance criteria: booking spanning Sep 28 — Oct 5 shows bar from Oct 1-5 with label on Oct 1

- [ ] **RT-3.4** Add feed health check endpoint
  - New file: `src/app/api/calendar/health/route.ts`
  - GET: for each property with calendar links, check if feeds are accessible and valid
  - Return: `{ properties: [{ id, name, airbnbFeed: { url, status, eventCount }, bookingFeed: { ... } }] }`
  - Acceptance criteria: endpoint returns 200 with feed status for each property

- [ ] **RT-3.5** Log sync event counts in Tasks panel summary
  - File: `src/components/tasks-panel.tsx`
  - Below the "Last sync" info, show a breakdown: "Airbnb: 22 events, Booking: 8 events" per property
  - Fetch from `/api/calendar/sync?propertyId=X` for event counts
  - Acceptance criteria: Tasks page shows per-platform event counts

---

## Week 4 — Guest Management & Extraction

- [ ] **RT-4.1** Add ability to manually edit guest data after extraction
  - File: `src/components/guest-cards.tsx`
  - Add an "Edit" button on each guest card header
  - Clicking opens inline editing for all fields (name, DOB, passport, etc.)
  - Save via PATCH `/api/guests/[id]` (need to add PATCH handler for all fields)
  - Acceptance criteria: can edit and save any guest field; changes persist after refresh

- [ ] **RT-4.2** Add PATCH endpoint for full guest updates
  - File: `src/app/api/guests/[id]/route.ts`
  - Add PATCH handler accepting any guest field update
  - Validate: passportNumber should be stripped of spaces, issuedBy should use sanitizeAlphanumeric
  - Acceptance criteria: PATCH with `{ fullName: "New Name" }` updates the guest; sanitization applies

- [ ] **RT-4.3** Add guest data export to CSV
  - File: `src/components/reservation-view.tsx`
  - Add "Export CSV" button next to the guest cards section
  - Generate CSV with all guest fields, download via browser
  - Acceptance criteria: clicking export downloads a .csv file with all guests for that reservation

- [ ] **RT-4.4** Show extraction success rate in reservation view
  - File: `src/components/reservation-view.tsx`
  - After extraction, show summary: "Extracted 3/3 passports successfully" or "2/3 extracted, 1 failed"
  - Include which files failed and why (from the log)
  - Acceptance criteria: extraction results show per-file status clearly

- [ ] **RT-4.5** Auto-calculate yearsOld from DOB on each page load
  - File: `src/components/guest-cards.tsx`
  - Instead of showing the stored `yearsOld` (which gets stale), calculate age from `dateOfBirth` dynamically
  - Keep the stored value as fallback if DOB is missing
  - Acceptance criteria: guest age updates correctly when viewed in a new year

---

## Week 5 — Testing & Documentation

- [ ] **RT-5.1** Set up testing framework (Vitest)
  - Install: `vitest`, `@testing-library/react` (if needed)
  - Create `vitest.config.ts` with path aliases matching tsconfig
  - Create first test: `src/lib/ical.test.ts` — test `parseICal`, `generateICal`, `addDays`, `generateBufferedEvents`
  - Acceptance criteria: `npx vitest run` passes with at least 5 tests for ical.ts

- [ ] **RT-5.2** Add unit tests for extraction sanitization
  - File: `src/app/api/extract/route.test.ts` or `src/lib/sanitize.test.ts`
  - Extract sanitization functions to `src/lib/sanitize.ts` (transliterate, sanitizeText, sanitizeAlphanumeric, stripSpaces)
  - Test: Cyrillic transliteration, dot/dash stripping, space collapsing, passport number stripping
  - Acceptance criteria: at least 10 test cases covering edge cases (empty strings, mixed scripts, special chars)

- [ ] **RT-5.3** Add unit tests for calendar buffer logic
  - File: `src/lib/ical.test.ts` (extend)
  - Test `generateBufferedEvents`: normal buffers, merged buffers, buffer=0, single event, adjacent events
  - Test `generateBufferOnlyEvents`: same-platform buffer generation
  - Acceptance criteria: at least 8 test cases for buffer logic

- [ ] **RT-5.4** Add API documentation README
  - File: `docs/API.md`
  - Document all API endpoints: method, path, request body, response format, auth requirements
  - Include examples with curl
  - Acceptance criteria: every endpoint under `/api/` is documented with at least method, path, and response shape

- [ ] **RT-5.5** Add deployment guide
  - File: `docs/DEPLOYMENT.md`
  - Document: Vercel setup, Turso DB creation, environment variables, seed script, cron setup
  - Include the cron-job.org setup steps
  - Acceptance criteria: a new developer could deploy the app from scratch following only this guide

---

## Week 6 — Performance & Polish

- [ ] **RT-6.1** Add pagination to properties API
  - File: `src/app/api/properties/route.ts`
  - Accept `?page=1&limit=20` query params
  - Return `{ data: [...], total: N, page: 1, limit: 20 }`
  - Keep backward compatibility: if no pagination params, return all (existing behavior)
  - Acceptance criteria: `?page=1&limit=5` returns first 5 properties with total count

- [ ] **RT-6.2** Lazy-load synced events in property calendar
  - File: `src/components/property-calendar.tsx`
  - Only fetch synced events when the calendar component mounts, not on every property selection
  - Add a loading state while events are being fetched
  - Acceptance criteria: switching between properties doesn't trigger unnecessary re-fetches; loading spinner shows

- [ ] **RT-6.3** Split property-calendar.tsx into smaller components
  - File: `src/components/property-calendar.tsx` (currently 700+ lines)
  - Extract: `CalendarGrid`, `CalendarLegend`, `CalendarNavigation`, `AgendaList` as separate components
  - Keep all in `src/components/calendar/` directory
  - Acceptance criteria: property-calendar.tsx is under 200 lines; all extracted components work correctly

- [ ] **RT-6.4** Add mobile-responsive layout
  - Files: `src/components/top-bar.tsx`, `src/app/page.tsx`
  - Add hamburger menu for mobile (hide full nav, show drawer)
  - Make calendar grid scroll horizontally on small screens
  - Make guest cards stack single-column on mobile
  - Acceptance criteria: app is usable on 375px wide viewport; no horizontal scroll on main content

- [ ] **RT-6.5** Add PWA manifest for mobile home screen
  - Files: `public/manifest.json`, `src/app/layout.tsx`
  - Add web app manifest with app name, icons, theme color
  - Add `<link rel="manifest">` to layout
  - Acceptance criteria: Chrome shows "Add to Home Screen" option; app opens fullscreen from home screen

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
