# Production Docker deployment

Production runs the `site` service in Compose project `renttools`, with container
`renttools-site`, on a shared ARM64 host. The registered runtime directory is
`/home/ubuntu/renttools`; its canonical configuration is `compose.hetzner.yml`.
Read the current private operations instructions and `/home/ubuntu/DEVBOX.md`
before operating the server. Connection details and credentials stay outside
this public repository.

## Authorization and release artifact

An explicit release instruction from the owner or a developer delegated this
project is required. Tests, a commit, a merge and a successful CI run do not
start a production deployment. There is no automatic production deployment.

The public [CI workflow](../.github/workflows/ci.yml) builds a native
`linux/arm64` release image off-host after checks pass on the exact `master`
revision. Its `renttools-arm64-<full SHA>` artifact contains:

- `renttools-arm64.tar.gz`: Docker image archive, tagged `renttools-site:<full SHA>`.
- `image.json`: CI image identity, platform, revision label and filesystem layers.
- `SHA256SUMS`: checksums for the image archive and identity metadata.

Artifacts expire after three days. Obtain a successful run for the exact
approved revision; if the artifact has expired, rerun CI for that revision.
Do not substitute an untested workstation image or build the app on the shared
production host. Runtime credentials never belong in CI or a build context.

The former hosted SSH deployment workflow has been retired. Its old GitHub
`DROPLET_*` settings describe a previous host. The installed `deploy.sh`,
`build-docker-release.sh`, `install-docker-build.sh` and
`github-deploy-gateway.sh` entrypoints on the current host deliberately refuse
execution. Keep those entrypoints retired and use the registered controller.
Do not upload a shared-host administrator key to GitHub Actions.

## Prepare and verify

1. Confirm the explicit release instruction, approved Git SHA and successful CI.
   Read the live host policy and check `/home/ubuntu/bin/devbox status` and
   `/home/ubuntu/bin/projectctl check renttools`. Record other running containers'
   IDs, start times and restart counts for comparison after release.
2. Download the exact CI artifact into a private project release directory.
   Verify the artifact ZIP against GitHub's artifact digest, its expected three
   files, and both `SHA256SUMS` entries. Check native `linux/arm64`, the immutable
   tag and `org.opencontainers.image.revision` against the approved full SHA.
3. Run the installed owned-project backup procedure, then its verification:

   ```bash
   python3 /home/ubuntu/migration/remaining-owned-backups.py renttools backup
   python3 /home/ubuntu/migration/remaining-owned-backups.py renttools verify
   ```

   The helper obtains central admission itself. Do not wrap it in a second
   heavy guard. It creates a consistent online SQLite backup and verifies the
   durable database and asset archive without restoring into production.
4. Preserve the previous `source-release`, `.source-commit`, Compose, recovery
   Dockerfile, release metadata and raw runtime environment in a private release
   checkpoint. The backup helper excludes runtime environment files; preserve
   those separately with restricted permissions. Keep the previous healthy image.
5. Import the verified image under the central guard. Use the exact project
   archive path in place of the placeholder:

   ```bash
   /home/ubuntu/bin/devbox heavy renttools-image-import 512 -- \
     docker load -i /path/to/verified/renttools-arm64.tar.gz
   ```

   Verify the loaded image against the archive's config digest, revision,
   platform and all filesystem layers. Classic Docker can report the config
   digest as `Id`, while a containerd image store reports the OCI manifest
   digest. Validate the digest chain in the verified archive instead of assuming
   those two identifiers must be identical. Save both identities privately.
6. Install an archive of the exact approved tracked source into `source-release`
   and write its full SHA to `.source-commit`. Do not overlay local work, runtime
   data or private configuration. Preserve the previous source for rollback.

Central admission serializes heavy work, including scheduled synchronization.
Wait for the slot when it is occupied. Never bypass admission, increase host
thresholds or interrupt another project's work to make a release pass.

## Install and validate

For a release with no schema changes, update only `services.site.image` and
`services.site.environment.GIT_COMMIT_SHA` in the registered Compose file.
Install the matching public `deploy/docker/Dockerfile` as the recovery
Dockerfile; do not build it on the host. Preserve the existing environment,
resource limits, runtime user, mounts, networks, ingress and scheduler.

Deploy only the registered application service:

```bash
/home/ubuntu/bin/projectctl deploy renttools --services site
```

The controller enforces the project's budget and the shared heavy slot. Do not
replace it with raw Compose or Docker startup commands. Never run a global
restart, prune, network replacement, daemon change or cleanup of another project.

Confirm all of the following before recording success:

- Container health, loaded image identity, full runtime SHA and the seven-character
  version at `https://renttools.io/api/health` match the approved release.
- Public HTTPS, database health, login and authenticated route boundaries work.
  Check the changed flow with synthetic data where needed; preserve operating data.
- Runtime settings and private environment are unchanged apart from image/revision.
  Compare secret-bearing configuration only in memory; never print its values.
- Other projects' container identities, start times and restart counts are unchanged.
  Recheck host admission and save private release evidence in `release.json` and
  the project release directory.

A schema-changing release additionally requires reviewed additive DDL, migration
rehearsal against a consistent backup, and a specific rollback procedure. A normal
application release does not authorize credential rotation or scheduler changes.

Run public HTTPS probes from a permitted external connection, such as the release
workstation. Cloudflare may block requests originating from the server itself.
Distinguish an edge rejection from application health: verify the container-local
endpoint and the external public endpoint before deciding whether to roll back.

## Rollback

Restore only this project's saved source, revision marker, Compose and recovery
Dockerfile. Start the previous healthy image through the same registered
`projectctl deploy renttools --services site` command and verify public health
and version again. Preserve current database/uploads and existing credentials;
never overwrite current writes with a stale database snapshot during image
rollback. A data restore requires a separate recovery procedure and writer handover.

Keep the current and previous healthy images, verified backups and release
checkpoints. Apply only the installed project retention policy; do not prune
shared images, caches, networks or volumes.
