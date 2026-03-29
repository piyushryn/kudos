import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "kudos_admin_session";

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** Temporary hardcoded gate — replace with proper auth later. */
export const HARDCODED_ADMIN_PASSWORD = "password@123";

const SESSION_SIGNING_SECRET = "kudos-dashboard-session-signing-secret";

export function adminPasswordMatches(input: string): boolean {
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(HARDCODED_ADMIN_PASSWORD, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = JSON.stringify({ exp, v: 1 });
  const sig = createHmac("sha256", SESSION_SIGNING_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) {
    return false;
  }
  const payloadB64 = token.slice(0, lastDot);
  const sigHex = token.slice(lastDot + 1);
  if (!/^[0-9a-f]{64}$/i.test(sigHex)) {
    return false;
  }
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expectedHex = createHmac("sha256", SESSION_SIGNING_SECRET).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expectedHex, "hex"))) {
      return false;
    }
  } catch {
    return false;
  }
  let parsed: { exp?: number };
  try {
    parsed = JSON.parse(payload) as { exp?: number };
  } catch {
    return false;
  }
  return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
}
