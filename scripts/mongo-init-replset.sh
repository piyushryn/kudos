#!/usr/bin/env bash
# Idempotently initiates a single-node replica set named "rs0" on the `mongo` service
# and waits for the node to become PRIMARY. Run once after mongo is healthy.
set -euo pipefail

: "${MONGO_INITDB_ROOT_USERNAME:?missing}"
: "${MONGO_INITDB_ROOT_PASSWORD:?missing}"

HOST="mongo:27017"
ADMIN_URI="mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${HOST}/admin?directConnection=true&authSource=admin"

echo "[mongo-init] waiting for mongod to accept authenticated connections..."
for _ in $(seq 1 60); do
  if mongosh "${ADMIN_URI}" --quiet --eval 'db.runCommand({ ping: 1 }).ok' 2>/dev/null | grep -q 1; then
    break
  fi
  sleep 2
done

echo "[mongo-init] checking replica set status..."
STATUS_OUTPUT="$(mongosh "${ADMIN_URI}" --quiet --eval '
  try {
    const s = rs.status();
    print("OK:" + s.ok);
  } catch (e) {
    print("ERR:" + (e.codeName || e.message));
  }
' || true)"
echo "[mongo-init] status: ${STATUS_OUTPUT}"

if echo "${STATUS_OUTPUT}" | grep -q "^OK:1"; then
  echo "[mongo-init] replica set already initiated."
else
  echo "[mongo-init] initiating replica set rs0..."
  mongosh "${ADMIN_URI}" --quiet --eval '
    const r = rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] });
    printjson(r);
    if (r.ok !== 1) { quit(1); }
  '
fi

echo "[mongo-init] waiting for node to become PRIMARY..."
for _ in $(seq 1 60); do
  PRIMARY="$(mongosh "${ADMIN_URI}" --quiet --eval 'db.hello().isWritablePrimary' 2>/dev/null || echo false)"
  if [ "${PRIMARY}" = "true" ]; then
    echo "[mongo-init] PRIMARY ready."
    exit 0
  fi
  sleep 1
done

echo "[mongo-init] timed out waiting for PRIMARY" >&2
exit 1
