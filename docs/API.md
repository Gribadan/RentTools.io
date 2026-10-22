# RentTools API

All endpoints are JSON unless noted. Base URL: `/`.

## Authentication

A successful `POST /api/auth/login` sets the `rent-tool-session` cookie (HTTP-only, JWT).
The middleware in `src/middleware.ts` rejects any request without a valid session
cookie with `401 { "error": "Unauthorized" }`, except for these public paths:

- `/api/auth/login`
- `/api/calendar/feed/*`
- `/api/calendar/cron`

In the table below, **Auth** = `session` means a valid session cookie is required;
`public` means no auth needed; `cron` means it expects `?token=$CRON_SECRET`.

Errors follow `{ "error": string }`. Standard codes:

- `400` — invalid input (missing field, malformed body, bad ID)
- `401` — missing or invalid session
- `404` — record not found
- `409` — conflict (e.g. overlapping reservation)
- `500` — unhandled server error

---

## Auth

### `POST /api/auth/login` — public
Body: `{ "username": string, "password": string }`
On success: sets `rent-tool-session` cookie; returns `{ user: { userId, username, role } }`.
On failure: `401 { "error": "Invalid credentials" }`.

### `POST /api/auth/logout` — session
Clears the session cookie. Returns `{ success: true }`.

### `GET /api/auth/session` — session
Returns the current user: `{ userId, username, role }` or `401`.

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret123"}' \
  https://app.example.com/api/auth/login
```

---

## Properties

### `GET /api/properties` — session
Returns `Property[]` with nested `reservations`, `calendarLinks`, and counts.

### `POST /api/properties` — session
Body: `{ "name": string, "minNights"?: number, "checkInTime"?: "HH:MM",
"checkOutTime"?: "HH:MM", "bookingWindow"?: number }`.
Returns the created `Property`.

### `PATCH /api/properties/[id]` — session
Body: any subset of the POST fields. Returns the updated `Property` or `400` for non-numeric `id`.

### `DELETE /api/properties/[id]` — session
Cascade-deletes the property and all related reservations/guests/links/events.
Returns `{ success: true }`.

---

## Reservations

### `GET /api/reservations/[id]` - session, property management access
Returns one reservation for the existing reservation card, including reservation-level
contact/group fields and the guest count. Guest records and travel-document fields
are not included; the existing guest endpoint applies its own management and support
redaction checks. Cleaner-only access and inaccessible reservations return `404`.
Responses are private and not cached.

### `GET /api/reservations?propertyId=X` — session
Returns `Reservation[]` with `_count.guests`. `propertyId` query param is required.

### `POST /api/reservations` — session
Body: `{ "name": string, "checkIn": ISODate, "checkOut": ISODate, "platform"?: "airbnb"|"booking"|"direct", "propertyId": number, "linkedEventUid"?: string }`.
Validates that `checkIn`/`checkOut` are valid dates and `checkOut > checkIn`.
Returns `409` if dates overlap an existing reservation for the same property.

### `PATCH /api/reservations/[id]` — session
Body: any of `{ name?, checkIn?, checkOut?, platform? }`.

### `DELETE /api/reservations/[id]` — session
Cascade-deletes the reservation and its guests.

---

## Guests

### `GET /api/guests?reservationId=X` — session
Returns `Guest[]` for the reservation, ordered by id.

### `PATCH /api/guests/[id]` — session
Body: any subset of guest fields plus `parentId` (for child→adult linkage).
`passportNumber` is stripped of whitespace; `issuedBy` is sanitized to Latin
letters/digits/spaces. Returns the updated `Guest`.

### `DELETE /api/guests/[id]` — session
Returns `{ success: true }`.

---

## Users

### `GET /api/users` — session
Returns `User[]` (without password hashes).

### `POST /api/users` — session, **superadmin only**
Body: `{ "username": string, "password": string (>= 8 chars), "role"?: "user"|"superadmin" }`.

### `DELETE /api/users/[id]` — session, superadmin only

---

## Settings

### `GET /api/settings` — session
Returns `{ [key]: string }` of all `AppSettings` rows.

### `PUT /api/settings` — session
Body: `{ [key]: string }`. Upserts each key/value.

---

## Passport extraction

### `POST /api/extract` — session
`multipart/form-data` body:
- `files` — one or more JPG/PNG/PDF passport images
- `reservationId` — string (numeric)

Calls Gemini Vision, sanitizes results, and creates `Guest` rows linked to the reservation.
Returns `{ data: SavedItem[] }` where each item is either a created guest, a `_action: "visa_updated"` guest, or `_action: "visa_no_match"`.

```bash
curl -b cookies.txt \
  -F "files=@passport.jpg" \
  -F "reservationId=42" \
  https://app.example.com/api/extract
```

---

## Calendar

### `GET /api/calendar/overview?month=YYYY-MM` - session
Returns `{ month, startDate, endDate, properties }` for one calendar month.
Properties are filtered server-side through the existing owner, manager, and
cleaner assignments. Each row contains calendar settings, `canManage`, projected
reservations/events, buffer settings, date-override types, and a `syncFailed` flag.
Initial occupancy queries are bounded to the month plus a margin derived from
cleaning buffers and minimum-stay settings. At most one preceding reservation
and one preceding source stay per property provide cleaning-gap context;
exact linked and overlapping claim partners are also returned so
clipping does not change existing booking identities. The endpoint does not
fetch unrestricted history. Display occupancy remains checkout-exclusive.

No guest records, document fields, feed URLs/tokens, reservation contacts, group
links, override notes, or source error text are returned. Cleaner-only rows use
generic booking names, omit persistent reservation IDs, and replace source UIDs
with response-local identities; they cannot open the management reservation card.
Invalid/missing months return `400`; occupancy failures return `500`, rather
than successful empty dates. Responses are private and not cached.

### `GET /api/live` — session

Opens a private `text/event-stream` connection for the signed-in user. A `refresh`
event with an empty JSON object signals a committed calendar change on a property
the user owns or is assigned to; clients reread their authorized API endpoints.
No guest information, calendar URLs or property identifiers are sent. Imported
calendar updates, reservation changes, date overrides and calendar-link changes
send notifications. Connections send keepalives and expire after five minutes so
reconnection revalidates the session. Limits return 429 with `Retry-After`.

The browser shares one connection per tab, rereads on reconnect and browser
resume, and retains its visible-tab refresh interval as a fallback. Publication
uses the current application process; multiple application workers require a
shared publisher before relying on cross-worker delivery.

### `GET /api/calendar/links?propertyId=X` — session
Returns `CalendarLink[]` for the property.

### `POST /api/calendar/links` — session
Body: `{ propertyId, platform: "airbnb"|"booking", icalExportUrl, bufferBefore?, bufferAfter? }`.

### `PATCH /api/calendar/links/[id]` — session
Update buffers or URL.

### `DELETE /api/calendar/links/[id]` — session

### `POST /api/calendar/sync` — session
Triggers a sync of all calendar links across all properties. Returns
`{ propertiesSynced, eventsCreated, eventsUpdated, errors }`.

### `GET /api/calendar/sync?propertyId=X` — session
Returns last-sync metadata: `{ lastFetchedAt, lastError, eventCounts: { airbnb, booking } }`.

### `POST /api/calendar/test` — session
Body: `{ icalExportUrl }`. Fetches and validates the URL without saving.
Returns `{ ok, eventCount, error? }`.

### `GET /api/calendar/feed/[propertyId]` — public
Public iCal feed (`text/calendar`) of buffered events for the property,
intended to be imported by Airbnb / Booking.com. Optional `?platform=` filter.

### `GET /api/calendar/feed/[propertyId]/[filename]` — public
Same content as above; the trailing filename is for platform compatibility
(some require a `.ics` suffix in the URL).

### `GET /api/calendar/cron` — cron
System-wide sync, authenticated by `Authorization: Bearer $CRON_SECRET` or
`?secret=$CRON_SECRET`. Uses the configured interval (default five minutes)
and persists the last start separately from completion. Schedule slots avoid
skipping a tick because of batch duration or scheduler jitter. Repeated calls
in the same slot and overlapping requests return `{ ok: true, skipped: true,
reason }`. Run one scheduler owner and one Node process; multiple workers need
a shared job lock. Manual refresh does not advance the global schedule.

### `GET /api/calendar/schedule` / `PUT /api/calendar/schedule` — superadmin
Reads / updates the global cron schedule. Accepts boolean `autoEnabled` and
`frequencyMinutes` of 5, 10, 15, 30, 60, 120, 360, 720 or 1440. Invalid settings
return 400. `lastRun` remains the last completion timestamp. Changes are audited.

### `GET /api/calendar/cron-url` — superadmin
Returns the scheduler URL only when a dedicated `CRON_SECRET` is configured.
Never exposes the session-signing secret. Other users receive 403.

### `GET /api/calendar/health` — session
Returns per-property feed status: `{ properties: [{ id, name, airbnbFeed: { url, status, eventCount }, bookingFeed: {...} }] }`.

---

## Date overrides

### `GET /api/date-overrides?propertyId=X` — session

### `POST /api/date-overrides` — session
Body: `{ propertyId, date: "YYYY-MM-DD", type: "open"|"closed", note?: string }`.

### `DELETE /api/date-overrides?id=X` — session
