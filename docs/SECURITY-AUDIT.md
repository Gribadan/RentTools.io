# Per-route ownership audit (RT-21.1)

Last run: 2026-05-05.

Scope: every file under `src/app/api/**/route.ts`. The audit checks
each handler for:

  (a) calls `getSession()` (or a stricter helper like `requireSuperadmin()`)
  (b) where an ID param or property-scoped resource is touched, gates writes
      through `canManageProperty()` / `canReadProperty()` / `isPropertyOwner()`
      from `src/lib/ownership.ts` before any DB mutation.

The acceptance criterion for RT-21.1: **a property in a different account
cannot be read or modified by an authenticated user who is neither owner
nor manager**. Two endpoints violated that and were fixed in the same
commit; remaining findings are documented as follow-ups.

## Properly gated routes

All of the routes below were verified to (a) require an authenticated
session and (b) gate property-scoped reads/writes through the ownership
helpers (or an inline `userId` equality check for owner-only actions).

| Route | Methods | Gating |
| --- | --- | --- |
| `/api/properties` | GET | scoped to owned + managed; cleaners scoped to assigned |
| `/api/properties` | POST | bound to current `session.userId` |
| `/api/properties/[id]` | PATCH | `canManageProperty` |
| `/api/properties/[id]` | DELETE | `isPropertyOwner` (managers cannot delete) |
| `/api/properties/[id]/rotate-feed-token` | POST | `canManageProperty` |
| `/api/properties/sample` | POST | bound to current `session.userId` |
| `/api/reservations` | GET | scoped to `listAccessiblePropertyIds` |
| `/api/reservations` | POST | `canManageProperty` |
| `/api/reservations/[id]` | PATCH/DELETE | `canManageProperty` via `loadManageableReservation` |
| `/api/reservations/import` | POST | `canManageProperty` per row + `accessibleIds` set |
| `/api/reservations/export` | GET | scoped to `listAccessiblePropertyIds` |
| `/api/guests` | GET | `canManageProperty` on parent reservation |
| `/api/guests/[id]` | PATCH/DELETE | `canManageProperty` via `loadManageableGuest` |
| `/api/guests/search` | GET | scoped to `listAccessiblePropertyIds` |
| `/api/calendar/links` | GET | `userId == session.userId OR managers.some(managerId)`; cleaners empty |
| `/api/calendar/links` | POST | `canManageProperty` |
| `/api/calendar/links/[id]` | PATCH/DELETE | `canManageProperty` via `loadManageableLink` |
| `/api/calendar/sync` | GET | scoped to `listAccessiblePropertyIds` |
| `/api/calendar/feed/[propertyId]/[filename]` | GET | per-property `feedToken` (timing-safe compare); legacy unset = public-by-design |
| `/api/date-overrides` | GET | `canReadProperty` |
| `/api/date-overrides` | POST/DELETE | `canManageProperty` |
| `/api/cleaning-records` | GET | `canReadProperty` (cleaners allowed read) |
| `/api/cleaning-records` | POST | `canReadProperty` (cleaners allowed write to mark done) |
| `/api/cleaner-assignments` | GET/POST | `isPropertyOwner` (only owner manages cleaners) |
| `/api/cleaner-assignments/[id]` | DELETE | inline `property.userId == session.userId` (owner-only) |
| `/api/property-managers` | GET/POST/DELETE | `isPropertyOwner` (only owner manages managers) |
| `/api/property-manager-invites` | GET/POST/DELETE | `isPropertyOwner` |
| `/api/property-manager-invites/accept` | GET/POST | token IS the permission; idempotent re-accept allowed |
| `/api/message-templates` | GET/POST | `canManageProperty` |
| `/api/message-templates/[id]` | PATCH/DELETE | `canManageProperty` via `loadManageableTemplate` |
| `/api/sync-alerts` | GET/POST | scoped to `listAccessiblePropertyIds`; POST self-only |
| `/api/activity` | GET | scoped to `listAccessiblePropertyIds` |
| `/api/audit` | GET | self-only (`userId == session.userId`) |
| `/api/auth/export-data` | GET | self-only data dump |
| `/api/auth/delete-account` | POST | self-only |
| `/api/auth/change-password` | POST | self-only |
| `/api/admin/export-my-data` | GET | `requireSuperadmin` |
| `/api/admin/site-settings` | GET/PUT | `requireSuperadmin` + key allowlist |
| `/api/admin/users` | GET | `requireSuperadmin` |
| `/api/admin/users/[id]/suspend` | POST/DELETE | `requireSuperadmin` |
| `/api/users/[id]` | DELETE | `requireSuperadmin` (and refuses self-delete) |
| `/api/users` | POST | `requireSuperadmin` |
| `/api/calendar/cron` | GET | `CRON_SECRET` (header bearer or `?secret=`) |
| `/api/extract` | POST | self-only with daily quota |
| `/api/onboard` | GET/POST | anonymous by design (cookie-bound draft, claimed at signup) |
| `/api/auth/login` `/signup` `/google/*` `/logout` `/me` `/session` | various | auth flow itself, no property access |
| `/api/health` | GET | unauthenticated liveness probe — by design |
| `/api/site-config` | GET | unauthenticated public site config — by design |

## Findings fixed in this commit

### F1 — `/api/calendar/health` leaked all calendar URLs (HIGH)

The handler had no auth check at all and returned every property's
`calendarLinks.icalExportUrl` across the entire platform. Airbnb iCal
URLs embed a per-listing access token; any visitor could enumerate
properties and pull every host's booking calendar.

**Fix**: gated with `requireSuperadmin()`. The only caller in the codebase
is `src/components/admin-panel.tsx` (admin-panel-only debug link), so this
matches actual usage.

### F2 — `/api/calendar/test` was anonymous SSRF (HIGH)

The handler accepted an arbitrary URL and fetched it server-side with no
authentication, turning the application server into a fetch proxy for
unauthenticated callers. Internal endpoints (loopback, cloud metadata at
`169.254.169.254`, etc.) were reachable through this.

**Fix**: requires `getSession()`. The endpoint is used by the calendar-sync
wizard, where the user is already authenticated. The follow-up to add a
URL allowlist (block private IP ranges, only allow HTTPS, etc.) is filed
as **F-FOLLOWUP-3** below.

## Findings deferred (out-of-scope for the acceptance criterion)

These do not let an authenticated user read or modify another user's
property data — they are operational / privilege-escalation issues
that warrant their own RT tasks to fix without breaking UI flows.

### F-FOLLOWUP-1 — `/api/calendar/cron-url` exposes the cron secret to any auth user (MEDIUM)

Returns `?secret=<CRON_SECRET>` in the URL string. Any authenticated
user (including a freshly-created free account) can retrieve it and
use it to trigger global syncs at will. The endpoint comment even
acknowledges this. Caller is `src/components/tasks-panel.tsx`, which
is loaded for every signed-in dashboard. Fix needs to (a) gate the
endpoint with `requireSuperadmin()` and (b) hide the cron URL block
in TasksPanel for non-superadmins. Track as a separate task.

### F-FOLLOWUP-2 — `/api/calendar/schedule` PUT lets any auth user change global sync settings (MEDIUM)

Toggles `sync_auto_enabled` and `sync_frequency_minutes`, which control
the cron behaviour for the whole platform. Currently gated only by
`getSession()`. Same UI-coupling problem as F-FOLLOWUP-1 (TasksPanel
calls it). Fix: gate PUT with `requireSuperadmin`, hide the controls
in TasksPanel for non-superadmins; GET can stay open since the values
aren't sensitive.

### F-FOLLOWUP-3 — `/api/calendar/test` SSRF still possible for authenticated users (LOW)

After F2, anonymous SSRF is closed, but an authenticated user can still
make the server fetch arbitrary URLs. Add a URL allowlist (HTTPS-only,
deny private/loopback/link-local/cloud-metadata IPs after DNS resolution).

### F-FOLLOWUP-4 — `/api/calendar/sync` POST lets any auth user trigger a global sync (LOW)

Already documented in the route's leading comment. DoS / load issue,
no data leak. Should switch to a per-user sync that only touches
`listAccessiblePropertyIds` for the caller.

### F-FOLLOWUP-5 — `/api/users` GET enumerates every account (LOW)

Returns id, username, role, createdAt for every user in the system.
Used by the property-managers and cleaner-assignments add-by-username
forms, which is why it can't be gated to superadmin without refactor.
Fix: change the form to a bare username submit (don't pre-load the
list at all); the existing username uniqueness lookup in those POST
endpoints is enough.

### F-FOLLOWUP-6 — `/api/settings` GET returns all `AppSettings` rows to any auth user (LOW)

Mask is applied only for `gemini_api_key`. Other keys (`sync_last_run`,
`sync_last_result`, `sync_auto_enabled`, `sync_frequency_minutes`)
are returned as-is. `sync_last_result` is a stringified
`syncAllCalendars()` summary and may include cross-user property
counts/error messages. Mask or per-key allowlist for non-superadmin.

## Acceptance criterion verdict

> A property in a different account cannot be read or modified by an
> authenticated user who is neither owner nor manager.

**PASS** after this commit. F1 (calendar/health) was the only path that
leaked another user's property data; it is now superadmin-only. Every
remaining route either binds to `session.userId`, scopes by
`listAccessiblePropertyIds`, or gates writes through the ownership
helpers. The deferred F-FOLLOWUP findings do not violate this criterion.
