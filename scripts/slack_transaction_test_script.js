#!/usr/bin/env node

const crypto = require("crypto");

const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const idx = args.indexOf(`--${key}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
};

const baseUrl = getArg("base-url", process.env.BASE_URL || "http://localhost:4000");
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const command = getArg("command", "/kudos");
const text = getArg("text", "<U034WPBRGS1> 10 great work");
const userId = getArg("user-id", "U09CLCHAMU0");
const userName = getArg("user-name", "piyush");
const channelId = getArg("channel-id", "C123");
const channelName = getArg("channel-name", "general");

if (!signingSecret) {
  console.error("SLACK_SIGNING_SECRET is required.");
  process.exit(1);
}

const bodyParams = new URLSearchParams({
  token: "fake",
  team_id: "T123",
  team_domain: "example",
  channel_id: channelId,
  channel_name: channelName,
  user_id: userId,
  user_name: userName,
  command,
  text,
  response_url: "https://example.com/response",
  trigger_id: "123.456",
});

const rawBody = bodyParams.toString();
const ts = Math.floor(Date.now() / 1000).toString();
const base = `v0:${ts}:${rawBody}`;
const sig = `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`;

async function run() {
  const response = await fetch(`${baseUrl}/slack/commands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Slack-Request-Timestamp": ts,
      "X-Slack-Signature": sig,
    },
    body: rawBody,
  });

  const responseText = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(responseText);
}

run().catch((error) => {
  console.error("Request failed:", error);
  process.exit(1);
});
