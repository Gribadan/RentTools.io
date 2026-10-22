# Monthly property calendar: local verification

Feature commit: `9e8dee2c92cb11a98e95b58502d6790fdb8e9c9d`.
Base: `cc1d4aa8a7cde7c92fcb28be464245994a60234b`.
Entry: `/dashboard?view=overview&overviewMonth=2026-10`.

This report records the original feature verification before publication and the
subsequent dependency patch. See [dependency verification](dependency-fix-verification.md)
for the resolved audit finding.

## Delivered behavior

- A separate All calendars tab shows properties as rows and date-only nights as
  columns. Property names and dates stay pinned; names wrap and dates scroll on mobile.
- Property search, month selection, previous/next month, and Today preserve the
  chosen calendar context when opening and returning from a reservation card.
- Existing calendar data helpers determine booking identity. Adjacent stays retain
  a four-pixel turnover boundary; overlapping stays use separate lanes. Long stays
  clip at month boundaries and their labels remain visible while scrolling.
- Manageable stays open the existing reservation card. Imported-only bars link to
  the individual calendar without creating or claiming a reservation.
- Loading, unavailable, no properties, no search results, and empty occupancy are
  separate states. Failed or never-synced feeds mark availability unverified. A
  failed refresh hides the grid until a successful retry.
- The new overview read endpoint bounds initial occupancy queries to one month.
  Exact linked source/claim partners are included where needed to preserve booking
  identity. Overview and card navigation do not fetch unrestricted history.
- Existing access helpers scope every server query. Cleaner-only projections omit
  reservation IDs, guest names, contacts, document data, source UIDs, and URLs.
  Existing guest-card management checks and support document masking are retained.
- Browser verification found an existing UTC-midnight display shift in reservation
  headings and generated group labels. These now use the canonical date-only parser
  and UTC formatting; stored dates and occupancy calculations are unchanged.

No schema, cancellation, iCal import/export, source synchronization, or stored
booking identity change is included in this feature.

## Local checks

The validation snapshot contained tracked source only, synthetic build settings,
and a separate synthetic SQLite fixture database. Runtime configuration and
production data were not copied into it.

| Check | Captured result |
| --- | --- |
| `npm ci` | Passed; lockfile unchanged |
| `npm test` | 52 files, 595 tests passed |
| TypeScript check | Passed |
| `npm run build -- --webpack` | Passed; 88 static pages and production traces generated |
| ESLint of 16 new/modified TypeScript files excluding existing reservation view | Passed without errors or warnings |
| Existing reservation-view lint comparison | Same six pre-existing errors as the base; the date change adds none |
| Whitespace, forbidden-path, and secret-content checks | Passed |
| Original dependency audit | Failed on the existing Vite dependency; resolved in the separate patch |
| Docker/runtime-image/ARM64 checks | Not available locally; require repository CI |

The local environment used Windows, Node 24.18.0, and npm 11.16.0. The default
Turbopack build failed while starting instrumentation loader workers with
`node process exited before we could connect`. The supported webpack build
completed without changing configuration or weakening checks. Repository CI
uses Node 22 on Linux and remains required before merge.

Regression cases cover October and January turnover, checkout-exclusive widths
and night counts, real overlaps, linked identities, leap months, year clipping,
three timezones, long names, cleaning visibility, failed feeds, URL restoration,
and owner/manager/cleaner/foreign-account access.

## Browser evidence

The isolated browser run used a local production server and synthetic fixtures;
external browser requests were blocked. The saved [browser report](browser-report.json)
contains 18 passing groups, no JavaScript errors, and no non-GET API requests.
All 15 screenshots are linked in the [evidence index](README.md).

Desktop and 375-pixel Chrome viewport checks cover keyboard navigation, horizontal
scrolling, frozen headers and property names, month navigation, card return,
zero/one/three properties, loading/error/retry states, search, Russian text, and
actual synthetic SQLite permission fixtures. Card dates remain 6–9 January when
viewed in Honolulu. Mobile evidence uses viewport emulation; iOS/Safari hardware
was not available.

The browser contexts and the isolated production server were closed after capture.
The feature patch is retained in [renttools-portfolio-calendar.patch](renttools-portfolio-calendar.patch).

## Earlier master CI diagnosis

After implementation, master advanced to
`a6ca4e94a2518095eb41fe3a68f27409e494c4a4`, adding five article translations
and their cover without changing application source, dependencies, or workflows.
The six blog files were checked independently against their Git blobs.

[Master run 39556764888](https://github.com/Gribadan/RentTools.io/actions/runs/39556764888)
failed at the high/critical dependency audit. Build, tests, Docker checks, and the
ARM64 job did not run. Captured job metadata is in [master-ci-jobs.json](master-ci-jobs.json).
Reproducing that lockfile locally identified Vite advisory `GHSA-587h-7wmj-h5pm`;
full remote job logs were unavailable during the original diagnosis. This report
does not present local reproduction as an inspection of those unavailable logs.

The separate Vite patch resolves that audit blocker and was checked together
with the unchanged blog files and calendar implementation. Merge and production
release remain subject to the normal repository checks and release procedure.
