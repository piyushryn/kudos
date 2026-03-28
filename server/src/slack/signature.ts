import crypto from "node:crypto";

import type { Request } from "express";

import { config } from "../config";

const timingSafeCompare = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const verifySlackRequestSignature = (req: Request): boolean => {
  const timestamp = req.header("x-slack-request-timestamp");
  const signature = req.header("x-slack-signature");
  const rawBody = (req as Request & { rawBody?: string }).rawBody;

  if (!timestamp || !signature || !rawBody) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const requestTs = Number(timestamp);
  if (Math.abs(now - requestTs) > 60 * 5) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const digest = crypto
    .createHmac("sha256", config.SLACK_SIGNING_SECRET)
    .update(baseString)
    .digest("hex");
  const expectedSignature = `v0=${digest}`;

  return timingSafeCompare(expectedSignature, signature);
};
