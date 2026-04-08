import { createHmac, timingSafeEqual } from "crypto";

import { runtimeEnv } from "@/lib/runtime-env";

export const USER_SESSION_COOKIE = "kudos_user_session_v1";
export const USER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

type UserSessionClaims = {
  slackUserId: string;
  displayName: string;
  exp: number;
  v: number;
};

const getUserSessionSecret = (): string => {
  const secret = runtimeEnv("USER_SESSION_SIGNING_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("USER_SESSION_SIGNING_SECRET must be set and at least 32 characters.");
  }
  return secret;
};

export function createUserSessionToken(slackUserId: string, displayName: string): string {
  const exp = Math.floor(Date.now() / 1000) + USER_SESSION_MAX_AGE_SEC;
  const payload = JSON.stringify({ slackUserId, displayName, exp, v: 1 } satisfies UserSessionClaims);
  const sig = createHmac("sha256", getUserSessionSecret()).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyUserSessionToken(token: string | undefined): UserSessionClaims | null {
  if (!token) {
    return null;
  }
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) {
    return null;
  }
  const payloadB64 = token.slice(0, lastDot);
  const sigHex = token.slice(lastDot + 1);
  if (!/^[0-9a-f]{64}$/i.test(sigHex)) {
    return null;
  }
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expectedHex = createHmac("sha256", getUserSessionSecret()).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expectedHex, "hex"))) {
      return null;
    }
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { exp?: unknown }).exp !== "number" ||
    typeof (parsed as { slackUserId?: unknown }).slackUserId !== "string" ||
    typeof (parsed as { displayName?: unknown }).displayName !== "string" ||
    (parsed as { exp: number }).exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return {
    slackUserId: (parsed as { slackUserId: string }).slackUserId,
    displayName: (parsed as { displayName: string }).displayName,
    exp: (parsed as { exp: number }).exp,
    v: typeof (parsed as { v?: unknown }).v === "number" ? (parsed as { v: number }).v : 1,
  };
}
