import { createHmac, timingSafeEqual } from "crypto";

type UserSessionClaims = {
  slackUserId: string;
  displayName: string;
  role: "user" | "admin" | "super_admin";
  exp: number;
  v: number;
};

export const verifyUserSessionToken = (
  token: string | undefined,
  signingSecret: string,
): UserSessionClaims | null => {
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

  const expectedHex = createHmac("sha256", signingSecret).update(payload).digest("hex");
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
    !["user", "admin", "super_admin"].includes(String((parsed as { role?: unknown }).role)) ||
    (parsed as { exp: number }).exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return {
    slackUserId: (parsed as { slackUserId: string }).slackUserId,
    displayName: (parsed as { displayName: string }).displayName,
    role: (parsed as { role: "user" | "admin" | "super_admin" }).role,
    exp: (parsed as { exp: number }).exp,
    v: typeof (parsed as { v?: unknown }).v === "number" ? (parsed as { v: number }).v : 1,
  };
};
