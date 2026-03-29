import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "kudos_admin_session";

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function isDashboardAuthConfigured(): boolean {
  const u = process.env.DASHBOARD_ADMIN_USERNAME?.trim();
  const p = process.env.DASHBOARD_ADMIN_PASSWORD;
  const s = process.env.DASHBOARD_AUTH_SECRET?.trim();
  return Boolean(u && p !== undefined && p.length > 0 && s && s.length >= 16);
}

function hashEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export function credentialsMatch(
  username: string,
  password: string,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  return hashEqual(username, expectedUsername) && hashEqual(password, expectedPassword);
}

export function createSessionToken(secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = JSON.stringify({ exp, v: 1 });
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifySessionToken(token: string | undefined, secret: string): boolean {
  if (!token || !secret) {
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
  const expectedHex = createHmac("sha256", secret).update(payload).digest("hex");
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
