# Security policy

RentTools handles reservation and guest identity data. Do not report a
security vulnerability in a public issue, discussion, pull request, commit
message, screenshot, or test fixture.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting:

<https://github.com/Gribadan/RentTools.io/security/advisories/new>

Include the affected feature or commit, reproducible steps using synthetic
data, impact, who can exploit it, and a suggested mitigation if known. Do not
access, alter, download, or retain another user's data while testing. Stop
after proving the issue with the minimum necessary request.

The maintainer will acknowledge a complete report as soon as practical,
coordinate a fix, and credit the reporter unless anonymity is requested. No
specific response deadline or bounty is promised.

## Supported versions

The hosted service and current `master` branch receive security fixes.
Self-hosters should update after reviewing release notes and taking a backup.

## Secrets and personal data

If a secret is committed, removing it is not sufficient: rotate it immediately
and notify the maintainer. Never include real guest names, contact details,
passport data, calendar bearer URLs, or production database content.
