import { createHmac } from "crypto";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

const encodeFormBody = (fields: Record<string, string>): string =>
  new URLSearchParams(fields).toString();

const signSlackRequest = (timestamp: string, rawBody: string): string => {
  const base = `v0:${timestamp}:${rawBody}`;
  const digest = createHmac("sha256", process.env.SLACK_SIGNING_SECRET as string)
    .update(base)
    .digest("hex");
  return `v0=${digest}`;
};

describe.sequential("slack route security middleware", () => {
  it("rejects requests with missing Slack signature headers", async () => {
    const rawBody = encodeFormBody({ command: "/unknown-command", text: "hi" });
    const res = await request(app)
      .post("/slack/commands")
      .set("content-type", "application/x-www-form-urlencoded")
      .send(rawBody);

    expect(res.status).toBe(401);
    expect(res.body.response_type).toBe("ephemeral");
  });

  it("rejects requests with invalid Slack signature", async () => {
    const rawBody = encodeFormBody({ command: "/unknown-command", text: "hi" });
    const timestamp = String(Math.floor(Date.now() / 1000));

    const res = await request(app)
      .post("/slack/commands")
      .set("content-type", "application/x-www-form-urlencoded")
      .set("x-slack-request-timestamp", timestamp)
      .set("x-slack-signature", "v0=invalid")
      .send(rawBody);

    expect(res.status).toBe(401);
    expect(res.body.response_type).toBe("ephemeral");
  });

  it("rejects requests with stale timestamp", async () => {
    const rawBody = encodeFormBody({ command: "/unknown-command", text: "hi" });
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 601);

    const res = await request(app)
      .post("/slack/commands")
      .set("content-type", "application/x-www-form-urlencoded")
      .set("x-slack-request-timestamp", staleTimestamp)
      .set("x-slack-signature", signSlackRequest(staleTimestamp, rawBody))
      .send(rawBody);

    expect(res.status).toBe(401);
    expect(res.body.response_type).toBe("ephemeral");
  });

  it("accepts valid signature and reaches command handler", async () => {
    const rawBody = encodeFormBody({ command: "/unknown-command", text: "hi" });
    const timestamp = String(Math.floor(Date.now() / 1000));

    const res = await request(app)
      .post("/slack/commands")
      .set("content-type", "application/x-www-form-urlencoded")
      .set("x-slack-request-timestamp", timestamp)
      .set("x-slack-signature", signSlackRequest(timestamp, rawBody))
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body.response_type).toBe("ephemeral");
  });

  it("rate-limits burst traffic to Slack commands endpoint", async () => {
    const requests = Array.from({ length: 65 }, () =>
      request(app).post("/slack/commands").set("content-type", "application/x-www-form-urlencoded").send(""),
    );
    const responses = await Promise.all(requests);
    const rateLimitedCount = responses.filter((res) => res.status === 429).length;
    expect(rateLimitedCount).toBeGreaterThan(0);
  });
});
