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

Create an Actions environment named **`Production`**, matching the workflow:

- add the maintainer as required reviewer;
- prevent self-review if another trusted maintainer is available;
- restrict deployment branches to `master`;
- store production-only secrets in the environment rather than repository-wide
  where practical;
- optionally add a short wait timer for an observation window.

The deploy workflow runs only after `CI` succeeds for the same `master` commit,
then pauses at this environment gate. Manual redeploys also require successful
CI for current `master`. The workflow checks the current branch head again
after approval so a delayed run cannot roll production back to an older commit.
After approval, both the normal artifact
installer and the fallback deploy script run SQLite's online backup plus
`PRAGMA integrity_check` before changing source, dependencies, artifacts, or
schema. A failed backup aborts the deployment while the current service keeps
running.

Before approving a database-affecting deployment:

1. confirm restore testing is current and the backup destination has space;
2. confirm `prisma/schema.prisma` and `prisma/push-schema.ts` are paired;
3. verify migrations are additive and idempotent;
4. identify whether rollback is code-only or requires a forward data repair;
5. verify every new required environment variable exists on the droplet.

To inspect the configured server before a release, manually run **Deploy to
droplet** with mode **preflight** on a protected, reviewed branch. It still
requires the `Production` environment approval. This mode only reports release
and health information, setting-presence booleans, and backup file metadata;
it does not build, deploy, create a backup, query guest data, or change the server.
Ordinary deployment remains restricted to current `master` with successful CI.

## 3. Security settings

Enable:

- private vulnerability reporting;
- Dependabot alerts and security updates;
- secret scanning and push protection when available for the repository plan;
- Actions approval for first-time contributors.

Never run contributor code with production secrets. The PR workflow has
read-only repository permission and uses no production credentials.

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

For repeated Actions emails, inspect the failed step before changing notification
preferences. A workflow failure with no jobs can mean invalid workflow syntax;
CI validates every workflow with a pinned, checksum-verified `actionlint` release
to catch those errors before merge. Audit failures need dependency updates, not
blind retries or disabling the audit gate.

GitHub's notification settings can limit Actions email to failed workflows and
use web notifications for routine repository discussion. Keep security advisory
and production failure alerts visible; avoid a blanket filter for GitHub mail.

## 7. Merge and release checklist

- [ ] Source PRs and authors are linked/credited
- [ ] Required review and CI are green on the final head
- [ ] `npm ci` succeeds from a clean dependency tree
- [ ] `npm audit --audit-level=high` succeeds
- [ ] `npx prisma generate`, `npm test`, and `npm run build` succeed
- [ ] Browser-only behavior has manual evidence
- [ ] Production configuration is ready; automated backup destination and restore drill are healthy
- [ ] Rollback path is written in the PR
- [ ] Deploy the approved commit and verify `/api/health`
- [ ] Smoke-test login, dashboard, calendar feed, and changed user flows
- [ ] Close or update superseded source PRs
