# Publishing blog content

Prepare a post as a pull request. Passing CI makes it eligible for review and
release; publishing a source commit does not deploy the hosted application.

1. Read the active locales in `src/lib/i18n/alternates.ts`. Prepare one Markdown
   file per locale, with the same slug and shared cover image. Validate each
   locale's frontmatter, internal links, TL;DR and FAQ.
2. Start a topic branch from current `master`, for example
   `git switch -c codex/blog-topic`. Keep all translations and the cover together.
3. Run `npm audit --audit-level=high`, `npx tsc --noEmit`,
   `npx vitest run src/lib/markdown.test.ts` and `npm run build`. Content changes
   still use the application dependency graph, so a new security advisory can
   block a post even when its Markdown is valid. A parsing check must use
   synthetic data; never run the blog seeder against an operating database as a
   validation shortcut.
4. Push the topic branch and open a PR using the repository template. Wait for
   required checks and review before merging. Do not push directly to `master`,
   bypass hooks or override a failed check to publish content.
5. After merging, the master CI run checks the exact revision and prepares a
   native ARM64 release image. It does not connect to production. A failed
   prerequisite skips the image job, leaving the running release untouched.
6. Release only after an explicit instruction, following
   [the current Docker procedure](DOCKER-DEPLOYMENT.md). Use its verified artifact,
   backup and registered controller. The retired SSH deployment workflow and
   former install scripts are not publication paths.
7. After an authorized release, inspect every locale's page, cover, canonical,
   hreflang, structured data and sitemap entry. Report source/PR readiness
   separately from verified publication on the hosted site.

## Reading a failed check

Read the exact workflow run's event, branch, commit and failed job step first.
Dependency failures include package names, advisory links and counts in the job
summary and error annotations. The gate fails when the registry report is
unavailable, as well as for high or critical findings; inspect that distinction
before retrying. Moderate findings remain visible without changing the threshold.

The hosted runner and its public repository metadata are independent of any
development workstation. Read job steps and check annotations through the
connected repository API or the GitHub run page before requiring a local shell
or downloading full job logs. If authentication must be refreshed, complete it
and retry the failed read. Authentication failure is not a CI failure cause.

Check production health separately if needed. A source check failure proves
neither an outage nor that production is healthy. Do not infer deployment from a
push, a green build or the presence of an image artifact.
