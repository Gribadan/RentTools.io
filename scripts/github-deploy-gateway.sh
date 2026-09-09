#!/usr/bin/env bash
# Install this reviewed file outside the source checkout. The dedicated GitHub
# key must use: restrict,command="/home/ubuntu/renttools/github-deploy-gateway.sh"
set -euo pipefail
umask 077
ROOT=/home/ubuntu/renttools
COMMAND=${SSH_ORIGINAL_COMMAND:-}

if [ "$COMMAND" = renttools-preflight ]; then
  exec python3 "$ROOT/deploy-preflight.py"
elif [[ "$COMMAND" =~ ^renttools-upload\ ([0-9a-f]{40})$ ]]; then
  SHA=${BASH_REMATCH[1]}
  mkdir -p "$ROOT/incoming"
  exec 8> "$ROOT/incoming/$SHA.upload.lock"
  flock -n 8 || { echo 'Upload already in progress.' >&2; exit 1; }
  # Bound disk consumption, use a private temporary file, and publish only a
  # complete upload. No client-controlled path or executable is accepted.
  exec timeout 600 python3 -c '
import hashlib, os, pathlib, shutil, sys, tempfile
target = pathlib.Path(sys.argv[1])
limit = 2 * 1024**3
if shutil.disk_usage(target.parent).free < limit + 2 * 1024**3:
    raise SystemExit("Insufficient disk space for an image upload.")
fd, temporary = tempfile.mkstemp(prefix=target.name + ".", dir=target.parent)
digest = hashlib.sha256()
size = 0
try:
    with os.fdopen(fd, "wb") as output:
        while chunk := sys.stdin.buffer.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                raise SystemExit("Image upload exceeds the size limit.")
            output.write(chunk)
            digest.update(chunk)
        output.flush()
        os.fsync(output.fileno())
    if size == 0:
        raise SystemExit("Empty image upload.")
    os.replace(temporary, target)
    target.with_suffix(target.suffix + ".sha256").write_text(digest.hexdigest() + "\n")
    print(digest.hexdigest())
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)
' "$ROOT/incoming/$SHA.image.tar.gz"
elif [[ "$COMMAND" =~ ^renttools-deploy\ ([0-9a-f]{40})$ ]]; then
  exec bash "$ROOT/install-docker-build.sh" "${BASH_REMATCH[1]}"
else
  echo 'Command is not allowed by the RentTools deployment gateway.' >&2
  exit 1
fi
