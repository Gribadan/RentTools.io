---
name: Bug report
about: Something doesn't work the way it should
title: "bug: "
labels: bug
assignees: ''
---

## What happened

<!-- A clear description of what's broken. One or two sentences. -->

## Steps to reproduce

1.
2.
3.

## Expected behavior

<!-- What should have happened? -->

## Actual behavior

<!-- What did happen? Paste exact error messages and screenshots if helpful. -->

## Environment

- **Where:** [ ] hosted (renttools.io)  [ ] self-hosted
- **Browser / OS:**
- **Commit / version:** <!-- `git log -1 --format="%h %s"` if self-hosted -->
- **Database:** [ ] local SQLite  [ ] Turso  [ ] other

## Logs

<!--
Self-hosted: `journalctl -u rent-tool -n 100` (droplet) or your dev server output.
Hosted: include the request URL + approximate timestamp so we can find it in logs.
Strip credentials and guest passport data before pasting.
-->

```
```

## Anything else

<!-- Workarounds you tried, related issues, hunches about the root cause. -->
