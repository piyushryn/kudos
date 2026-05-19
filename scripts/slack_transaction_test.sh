#!/usr/bin/env bash
# Signs and POSTs a fake Slack slash-command request to the kudos server.
# Requires: bash, curl, openssl. Uses python3 (or perl) for URL-encoding.
#
# Usage:
#   SLACK_SIGNING_SECRET=... ./scripts/slack_transaction_test.sh \
#     [--base-url http://localhost:4000] \
#     [--command /kudos] \
#     [--text '<@U09GZ7JCRBM> 10 great work'] \
#     [--user-id U09CLCHAMU0] [--user-name piyush] \
#     [--channel-id C0AQ8HCLCQK] [--channel-name kudos-test]
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
COMMAND="${COMMAND:-/kudos}"
TEXT="${TEXT:-<@U034WPBRGS1> 10 great work}"
USER_ID="${USER_ID:-U09CLCHAMU0}"
USER_NAME="${USER_NAME:-piyush}"
CHANNEL_ID="${CHANNEL_ID:-C123}"
CHANNEL_NAME="${CHANNEL_NAME:-general}"

while [ $# -gt 0 ]; do
  case "$1" in
    --base-url)     BASE_URL="$2";     shift 2 ;;
    --command)      COMMAND="$2";      shift 2 ;;
    --text)         TEXT="$2";         shift 2 ;;
    --user-id)      USER_ID="$2";      shift 2 ;;
    --user-name)    USER_NAME="$2";    shift 2 ;;
    --channel-id)   CHANNEL_ID="$2";   shift 2 ;;
    --channel-name) CHANNEL_NAME="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [ -z "${SLACK_SIGNING_SECRET:-}" ]; then
  echo "SLACK_SIGNING_SECRET is required." >&2
  exit 1
fi

urlencode() {
  # Read stdin, print URL-encoded form (application/x-www-form-urlencoded).
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import sys,urllib.parse; sys.stdout.write(urllib.parse.quote_plus(sys.stdin.read()))'
  elif command -v perl >/dev/null 2>&1; then
    perl -MURI::Escape -e 'local $/; print uri_escape(<STDIN>, "^A-Za-z0-9\-._~")'
  else
    echo "Need python3 or perl for URL encoding." >&2
    exit 1
  fi
}

enc_command=$(printf '%s' "$COMMAND" | urlencode)
enc_text=$(printf '%s' "$TEXT" | urlencode)

body="token=fake"
body+="&team_id=T123"
body+="&team_domain=example"
body+="&channel_id=${CHANNEL_ID}"
body+="&channel_name=${CHANNEL_NAME}"
body+="&user_id=${USER_ID}"
body+="&user_name=${USER_NAME}"
body+="&command=${enc_command}"
body+="&text=${enc_text}"
body+="&response_url=https%3A%2F%2Fexample.com%2Fresponse"
body+="&trigger_id=123.456"

ts=$(date +%s)
base="v0:${ts}:${body}"
sig_hex=$(printf '%s' "$base" | openssl dgst -sha256 -hmac "$SLACK_SIGNING_SECRET" | awk '{print $NF}')
sig="v0=${sig_hex}"

echo "POST ${BASE_URL}/slack/commands" >&2
echo "command=${COMMAND} text=${TEXT}" >&2

http_code=$(curl -sS -o /tmp/slack-resp.$$ -w '%{http_code}' \
  -X POST "${BASE_URL}/slack/commands" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Slack-Request-Timestamp: ${ts}" \
  -H "X-Slack-Signature: ${sig}" \
  --data "${body}")

echo "Status: ${http_code}"
cat /tmp/slack-resp.$$
echo
rm -f /tmp/slack-resp.$$
