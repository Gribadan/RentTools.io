# Maintainer GitHub settings and PR runbook

Repository files provide CI, ownership, templates, and deployment ordering.
GitHub settings make those controls mandatory. Configure the following once as
the repository owner.

## 1. Protect `master`

Create a branch ruleset targeting the default branch (`master`):

- require a pull request before merging;
- require **1 approval**;
- dismiss stale approvals when new commits are pushed;
- require review from Code Owners;
- require conversation resolution;
- require status check **Build + tests**;
- require branches to be up to date before merging;
- block force pushes and branch deletion;
- keep administrator bypass available only while this is a one-maintainer
  repository; record every bypass in the PR;
- once a second trusted maintainer exists, enforce the ruleset for
  administrators too and require that person's approval for owner-authored PRs.

Use squash merge by default and enable automatic deletion of merged branches.
Do not allow direct pushes to `master`. An emergency fix still goes through a
small PR. A solo-maintainer integration may use administrator bypass only after
all required checks succeed, with the reason recorded in the PR. For ordinary
external PRs, the owner supplies the required independent review.

## 2. Protect production

Production releases follow [DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md), the
ignored local deployment guide, and the live host policy. There is no automatic
production deployment or GitHub SSH deployment workflow. Do not restore the
retired gateway, old Actions environment, or former deployment secrets.

An explicit release instruction is required separately from permission to fix,
review, push or merge code. CI creates a native ARM64 image only for tested
`master` revisions. The image is a release artifact, not an automatic rollout.
Use the exact successful artifact and the registered project controller. The
shared host builds nothing. Preserve current/previous images, backups, data and
other projects. An image job skipped on a PR is expected.

Before a database-affecting release, verify paired Prisma/DDL changes, additive
idempotent migrations, a current verified backup, a migration rehearsal, required
runtime settings and a specific rollback procedure.

## 3. Security settings

Enable:

- private vulnerability reporting;
- Dependabot alerts and security updates;
- secret scanning and push protection when available for the repository plan;
- Actions approval for first-time contributors.

Never run contributor code with production secrets. The build job has read-only
repository permission. CodeQL additionally requests permission to upload security
results; neither workflow uses production credentials.

### CodeQL coverage

[CodeQL Advanced](../.github/workflows/codeql.yml) explicitly analyzes
`actions` and `javascript-typescript` on every PR to `master`, pushes to
`master`, weekly scans and manual dispatches. Keep both languages enabled.
Do not add actor exclusions or path filters for dependency-only changes.
Use `pull_request`, including Dependabot and forks, rather than
`pull_request_target`; scans need no production credentials or dependency build.

GitHub's default setup does not analyze Dependabot PRs. It can produce a neutral
CodeQL check saying that configurations on `master` were not found. This means
missing coverage, not a successful scan or a failing application build.
See [GitHub's explanation](https://github.com/orgs/community/discussions/121836)
and [Dependabot upload permissions](https://docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/resource-not-accessible).
Closing/reopening or blindly retrying the build does not repair this setup.

When migrating from default setup:

1. Keep default setup active while validating the new workflow with SARIF upload
   temporarily set to `never` on the migration branch. Review both analyzer runs.
   This is a rehearsal, not a processed security result, and must not be merged.
2. Save the existing configuration privately. In a controlled maintenance window,
   disable default setup, remove the temporary upload override, and rerun the
   final PR head. GitHub rejects advanced uploads while default setup is enabled.
3. Verify both real analyzer jobs and processed results. Merge the reviewed
   workflow, then verify both languages on the exact new `master` SHA. If the
   replacement fails, restore the saved default setup and stop the migration.
4. Update already-open dependency branches from `master` and verify their real
   PR scans. A successful scan on `master` alone does not cover those PRs.

Keep `Build + tests` required. Once the advanced baseline and PR runs are
verified, require `CodeQL (actions)` and `CodeQL (javascript-typescript)` from
GitHub Actions as well, plus the processed `CodeQL` result from GitHub Advanced
Security. The analyzer checks enforce coverage; the result check enforces the
configured alert threshold. CodeQL merge protection can enforce alert severities
instead when available. Successful execution alone does not mean zero alerts.
Do not disable review or security protection to resolve a missing scan.

## 4. Reviewing a contribution

Review the final combined diff, not only the latest commit. Use this order:

1. **Intent:** does it solve a real issue without silently changing unrelated
   behavior?
2. **Trust boundaries:** auth, ownership, bearer tokens, PII, logs, SSRF, rate
   limits, and impersonation.
3. **Stored data:** migration safety, compatibility with existing rows, key
   rotation, deletion/retention, and rollback.
4. **Calendars:** date exclusivity, channel identity, stable UIDs, loop guards,
   occupancy, buffers, and existing links.
5. **Operations:** required configuration, deployment ordering, cron, health
   checks, backups, and resource limits.
6. **Evidence:** regression tests plus manual testing for browser/file-upload
   behavior that unit tests cannot cover.

Green CI is necessary, not sufficient. Tests prove only the cases they cover.
Request changes when a PR disables existing functionality by default, requires
undeployed configuration, bundles unrelated work, or has no safe rollback.

## 5. Overlapping and duplicate PRs

Do not merge both. Create a temporary integration branch from current
`master`, apply the useful commits, resolve overlap once, add regression tests,
and open one maintainer-owned integration PR. In its description:

- link every source PR;
- credit each author;
- state what was accepted, changed, or rejected and why;
- close the source PRs as merged/superseded after integration lands.

## 6. Dependency PRs

- Patch/minor groups: apply to the current integration head, regenerate the
  lockfile, run `npm ci`, `npm audit`, Prisma generation, tests, and build.
- Major upgrades: one dependency family per PR; check peer-dependency validity
  with `npm ls`; add focused manual tests for the feature that uses it.
- Runtime types must match the runtime (currently Node 22).
- Never use `npm audit fix --force` on the production branch.
- A transitive override is acceptable only when the patched version is API
  compatible and the clean-install/build/test path proves it.

Security updates are grouped separately from routine version updates. When
several packages have advisories, validate their fixes together: an individual
fix can still fail CI because the base branch contains another vulnerability.
Keep the high/critical audit gate enabled.

## Notification triage

An external fork or pull request is a proposal; it does not grant repository
write access or change the hosted instance. A security reporter listed as a
collaborator on a private advisory has access to that advisory, not automatically
to the repository. Check **Settings → Collaborators** before changing access.

For repeated Actions emails, inspect the exact final PR head and the failing
step before changing settings. Start with this read-only diagnostic:

```bash
node scripts/github-pr-status.mjs <PR-number> --repo <owner/repository>
```

It reports build, CodeQL coverage, review and merge state separately. Exit zero
means the inspection succeeded, not that a merge or release is authorized.
`neutral`, `skipped`, absent analysis and successful analyzer jobs without a
processed CodeQL result are not verified security coverage.

- `REVIEW_REQUIRED`: the code owner must approve an external/bot PR. Retrying CI
  cannot supply approval. GitHub prevents authors approving their own PRs; a
  reviewed solo-maintainer integration follows the documented bypass exception.
- `BEHIND`: update from `master`, then check the new final head and stale reviews.
- Failed tests/build/audit: inspect the failed step and fix its cause.
- No jobs: validate workflow syntax; CI runs checksum-verified `actionlint`.
- Missing CodeQL on Dependabot: verify advanced setup and both language results.
- ARM64 skipped on a PR: expected; it is built after successful `master` CI.

Audit failures need dependency updates, not blind retries or disabling the gate.
Keep major toolchain upgrades separate from routine patch/minor updates.

GitHub's notification settings can limit Actions email to failed workflows and
use web notifications for routine repository discussion. Keep security advisory
and production failure alerts visible; avoid a blanket filter for GitHub mail.

## 7. Merge and release checklist

- [ ] Source PRs and authors are linked/credited
- [ ] Required review and CI are green on the final head; both CodeQL languages have processed results
- [ ] `npm ci` succeeds from a clean dependency tree
- [ ] `npm audit --audit-level=high` succeeds
- [ ] `npx prisma generate`, `npm test`, and `npm run build` succeed
- [ ] Browser-only behavior has manual evidence
- [ ] Production configuration is ready; automated backup destination and restore drill are healthy
- [ ] Rollback path is written in the PR
- [ ] Obtain explicit release authorization separately from merge approval
- [ ] If a release was authorized, deploy the exact verified ARM64 artifact and verify `/api/health`
- [ ] Smoke-test login, dashboard, calendar feed, and changed user flows
- [ ] Close or update superseded source PRs
