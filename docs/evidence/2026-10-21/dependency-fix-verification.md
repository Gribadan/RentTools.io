# Vite dependency patch: verification

Feature commit: `9e8dee2c92cb11a98e95b58502d6790fdb8e9c9d`.
Dependency commit: `4ff9f566f09200885fd251472f77ed7f952dad8e`.
Compatibility target: `a6ca4e94a2518095eb41fe3a68f27409e494c4a4`.

This report records verification completed before branch publication. Historical
publication flags in [dependency-fix-results.json](dependency-fix-results.json)
describe that original phase.

## Change

The existing lockfile selected Vite 8.2.2 through Vitest 4.1.11 and failed the
high/critical audit. The patch adds the exact override `vite: "8.2.4"` and updates
only the Vite lockfile node. Both Vitest and its mocker accept this Vite release
line; the checked dependency graph has one deduplicated Vite version and no
invalid peers.

The original finding was `GHSA-587h-7wmj-h5pm`. The captured clean audit also has
no moderate findings. No broad dependency upgrade, downgrade, forced audit fix,
audit suppression, or workflow change was used.

Although Vite is a development dependency, the runtime Docker stage copies build
dependencies. Verification does not assume Vite is absent from the runtime image.

## Compatibility

The feature's 18 paths and master's six blog paths do not overlap. Before this
patch, both heads used identical package manifests and lockfiles. The validation
snapshot combined the calendar source, all six unchanged blog files, and this
two-file dependency patch.

All five Markdown article files match their expected Git blob hashes after CRLF
normalization; the cover matches byte for byte. The hashes are retained in
[master-blog-compatibility.json](master-blog-compatibility.json). The snapshot's
20 feature/dependency files also matched the canonical source by SHA256.

## Captured checks

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 660 packages installed and Prisma client generated |
| `npm audit --audit-level=high --json` | Passed; zero findings across all severities |
| `npm test` | Passed; 52 files and 595 tests |
| `tsc --noEmit --incremental false` | Passed |
| `npm ls vite vitest @vitest/mocker` | Passed; Vite 8.2.4, Vitest/mocker 4.1.11, no invalid peers |
| Default `npm run build` | Windows instrumentation loader worker startup failure |
| `npm run build -- --webpack` | Passed; compilation, TypeScript, 88 static pages, traces |
| Six blog Git blob checks | All matched the compatibility target |
| Whitespace checks and normal pre-commit hook | Passed |

The default build failure matches the feature's existing local Windows
limitation. No build scripts, instrumentation settings, or security checks were
changed to obtain a passing result. Node 22/Linux CI, Docker migration/runtime
checks, and native ARM64 image checks remain required where applicable.

The structured [results](dependency-fix-results.json), [clean audit](npm-audit-after-vite.json),
and [dependency patch](renttools-vite-audit-fix.patch) are retained alongside the
unchanged [feature patch](renttools-portfolio-calendar.patch).

## UI evidence and release

This dependency patch does not change the UI. The screenshots and completed
18-group browser report belong to the unchanged feature implementation. All
screenshots use synthetic data; no production data or runtime credentials were
needed for verification.

The application change has no schema migration. Normal rollback reverts the
application commits through the reviewed release process while preserving
persistent data. A passing check or branch push does not itself deploy the site.
