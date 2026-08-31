## Why

<!-- What user problem does this solve? Link an issue when one exists. -->

## What changed

<!-- Call out behavior removed or changed, not only additions. -->

## Risk

- [ ] Authentication, authorization, public/bearer-token route, or PII
- [ ] Database schema, migration, backfill, or stored-data format
- [ ] Calendar import/export, UID, date, occupancy, or sync behavior
- [ ] Deployment, environment variables, workflow, cron, or infrastructure
- [ ] Dependency or lockfile update
- [ ] Existing user-facing behavior is intentionally removed or disabled
- [ ] None of the above

For every checked risk, describe the failure mode and rollback:

## Verification

- [ ] `npm ci`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] New or changed behavior has a regression test where practical
- [ ] Existing behavior affected by this change was tested
- [ ] No secrets, guest data, passport data, private URLs, or production identifiers are included
- [ ] Schema changes update both `prisma/schema.prisma` and `prisma/push-schema.ts`
- [ ] New environment variables are documented in `.env.example` and deployment/runbooks
- [ ] I reviewed the final diff, not only the individual commits

## Manual test evidence

<!-- Steps, synthetic screenshots, or "not applicable" and why. -->

## Rollout and rollback

<!-- Is automatic rollout safe? How can this be reverted without data loss? -->
