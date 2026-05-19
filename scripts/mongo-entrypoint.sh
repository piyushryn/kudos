#!/usr/bin/env bash
# Ensures an internal-auth keyfile exists before starting mongod with --replSet.
# Required because enabling replication with authentication forces keyfile (or x509) auth.
set -euo pipefail

KEYFILE="/data/configdb/mongo-keyfile"

if [ ! -s "${KEYFILE}" ]; then
  # 756 random base64 bytes is the size recommended by the MongoDB docs.
  openssl rand -base64 756 > "${KEYFILE}"
fi

chmod 400 "${KEYFILE}"
# The mongo image runs as the `mongodb` user; ignore failures (e.g., on bind mounts).
chown mongodb:mongodb "${KEYFILE}" 2>/dev/null || true

exec /usr/local/bin/docker-entrypoint.sh "$@"
