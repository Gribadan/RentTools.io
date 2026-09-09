# Production Docker deployment

Production runs the `site` service in Compose project `renttools`, with container
`renttools-site`, under `/home/ubuntu/renttools`. The host also serves other
projects through the shared `edge_net` network and Caddy. The old systemd/nginx
instructions and `scripts/install-build.sh` do not apply to this deployment.

## Release gates and credentials

`.github/workflows/deploy.yml` builds an immutable `renttools-site:<full SHA>`
image only for current `master` after successful CI for that exact commit.
The deployment then requires the GitHub `Production` environment approval and
checks that `master` has not advanced. A manual `preflight` run uses the same
environment approval and makes no server or database changes.

Use a dedicated SSH key for GitHub, stored as the **Production environment**
secret `DEPLOY_KEY`. Its server `authorized_keys` entry must restrict it to:

```text
restrict,command="/home/ubuntu/renttools/github-deploy-gateway.sh" <public key>
```

Configure `DROPLET_HOST`, `DROPLET_USER` and `DROPLET_KNOWN_HOSTS` for the current
host. Verify its host key through an existing trusted connection before storing
the known-hosts entry. Do not put a general shared-host administrator key in
GitHub. The gateway accepts only `renttools-preflight`, `renttools-upload <SHA>`
and `renttools-deploy <SHA>`; arbitrary shell, forwarding and SFTP are unavailable.

A maintainer installs these reviewed files through their existing administrator
connection, with Unix line endings, owner `ubuntu`, and no other-user writes:

| Repository file | Installed path | Mode |
| --- | --- | --- |
| `scripts/github-deploy-gateway.sh` | `/home/ubuntu/renttools/github-deploy-gateway.sh` | `700` |
| `scripts/install-docker-build.sh` | `/home/ubuntu/renttools/install-docker-build.sh` | `700` |
| `.github/scripts/deploy-preflight.py` | `/home/ubuntu/renttools/deploy-preflight.py` | `600` |

Workflow runs upload only the image, never executable deployment scripts.
Changes to these installed scripts require a separate maintainer review and
installation. Test the dedicated key with a denied arbitrary command and a
successful `renttools-preflight` before enabling deployment.

## Runtime configuration and data

The existing `docker-compose.yml` supplies networks, mounts, restart policy and
resource limits. The installer creates `deploy.override.yml` for the immutable
image, UID/GID `1000:1000`, restricted Linux capabilities, and runtime settings.
It changes only `site` using `--no-deps --no-build --pull never`. It never
recreates Caddy, removes networks, or prunes Docker globally.

`secrets.env` must be private to the deployment account and contain `JWT_SECRET`,
`CRON_SECRET`, the existing 64-hex-character `GUEST_DATA_ENCRYPTION_KEY`, and
`PUBLIC_APP_URL` including `https://renttools.io`. Preserve existing key values.
The effective database URL is explicitly `file:/data/prod.db`, overriding any
legacy relative value in the environment file. The preserved bind mounts are:

| Host directory | Container directory |
| --- | --- |
| `/home/ubuntu/renttools/data` | `/data` |
| `/home/ubuntu/renttools/uploads` | `/app/public/uploads` |
| `/home/ubuntu/renttools/backups` | `/backups` |

The installer requires these directories to belong to UID 1000, an initially
running service, at least 4 GiB free, and an unchanged tracked source snapshot
under `app`. The source snapshot is retained without reset or overwrite.
`release.json`, the image revision label and `/api/health` identify deployed code;
the old source snapshot's Git SHA does not identify the running image.

## Database migration and recovery

Before changing the app, the installer uses SQLite's online backup API and
verifies database integrity. It rehearses the candidate schema runner on that
same snapshot in a container without network access. It rejects removed tables,
columns, stored rows, incompatible column changes and foreign-key violations.
Private logs and backup copies remain in `backups/deploy-*` and are never
uploaded to GitHub.

Only after rehearsal does the installer stop RentTools, take a fresh final
backup, and run the production migration. If migration fails before the
candidate can start, it restores the final backup through SQLite's backup API
while app writers are stopped, then verifies the previous image and health.
If the candidate has started, rollback replaces only the app image and preserves
the database, including possible new user writes. It does not automatically
overwrite data with an earlier snapshot. A failed rollback requires maintainer
inspection of the private logs and backups before further changes.

Success requires the running image ID, full runtime SHA, health endpoint's
seven-character SHA, HTTP success and database health to match. Stale calendar
sync makes the application health endpoint fail too; inspect and resolve the
sync condition rather than declaring a release healthy from container state.

Successful image uploads are removed. Image retention keeps the current and
previous image plus the three newest RentTools images; only eligible
`renttools-site` tags are removed, without force. Verified database backups are
preserved. Review their storage usage and the existing off-host backup policy
periodically; delete backups only under a separately reviewed retention policy.
Failed uploads and deployment logs remain available for diagnosis.
