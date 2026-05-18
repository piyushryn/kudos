import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { runtimeEnv } from "@/lib/runtime-env";
import {
  USER_SESSION_COOKIE,
  USER_SESSION_MAX_AGE_SEC,
  createUserSessionToken,
} from "@/lib/user-session";

const OAUTH_STATE_COOKIE = "kudos_slack_oauth_state";
const OAUTH_NEXT_COOKIE = "kudos_slack_oauth_next";
const OAUTH_NONCE_COOKIE = "kudos_slack_oauth_nonce";

const requiredEnv = (name: string): string => {
  const value = runtimeEnv(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
};

type SlackTokenResponse = {
  ok: boolean;
  access_token?: string;
  id_token?: string;
  error?: string;
};

type SlackUserInfo = {
  sub?: string;
  name?: string;
  email?: string;
  "https://slack.com/user_id"?: string;
};

type SessionRoleResponse = {
  slackUserId: string;
  displayName: string;
  role: "user" | "admin" | "super_admin";
};

const parseSuperAdminSlackIds = (): Set<string> => {
  const raw = runtimeEnv("SUPER_ADMIN_SLACK_USER_IDS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
};

const safeRedirectPath = (candidate: string | undefined): string => {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/leaderboard";
  }
  return candidate;
};

const publicOriginFromRequest = (request: Request): string => {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
};

const resolveSessionRole = async (
  slackUserId: string,
  displayName: string,
): Promise<SessionRoleResponse> => {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");
  const response = await fetch(`${base}/public/session-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slackUserId, displayName }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve session role (${response.status})`);
  }

  return (await response.json()) as SessionRoleResponse;
};

const failedAuthRedirect = (request: Request, message: string) => {
  const publicOrigin = publicOriginFromRequest(request);
  return NextResponse.redirect(
    new URL(`/admin/login?error=${encodeURIComponent(message)}`, publicOrigin),
  );
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const jar = await cookies();
  const storedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  const storedNext = jar.get(OAUTH_NEXT_COOKIE)?.value;
  const storedNonce = jar.get(OAUTH_NONCE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState || !storedNonce) {
    return failedAuthRedirect(request, "Slack authentication failed.");
  }

  const tokenRes = await fetch("https://slack.com/api/openid.connect.token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: requiredEnv("SLACK_OIDC_REDIRECT_URI"),
      client_id: requiredEnv("SLACK_OIDC_CLIENT_ID"),
      client_secret: requiredEnv("SLACK_OIDC_CLIENT_SECRET"),
    }),
    cache: "no-store",
  });
  const tokenBody = (await tokenRes.json()) as SlackTokenResponse;
  if (!tokenRes.ok || !tokenBody.ok || !tokenBody.access_token) {
    return failedAuthRedirect(request, `Slack token exchange failed: ${tokenBody.error ?? tokenRes.statusText}`);
  }

  const userInfoRes = await fetch("https://slack.com/api/openid.connect.userInfo", {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    cache: "no-store",
  });
  const userInfo = (await userInfoRes.json()) as SlackUserInfo;
  const slackUserId = userInfo["https://slack.com/user_id"] ?? userInfo.sub;
  if (!userInfoRes.ok || !slackUserId) {
    return failedAuthRedirect(request, "Slack user profile fetch failed.");
  }

  const displayName = userInfo.name || userInfo.email || slackUserId;
  let resolved: SessionRoleResponse;
  try {
    resolved = await resolveSessionRole(slackUserId, displayName);
  } catch {
    return failedAuthRedirect(request, "Unable to resolve role for this user.");
  }

  // Fallback safeguard: if this Slack user is configured as super admin in env,
  // force the token payload role at issuance time.
  if (parseSuperAdminSlackIds().has(resolved.slackUserId)) {
    resolved = {
      ...resolved,
      role: "super_admin",
    };
  }

  const publicOrigin = publicOriginFromRequest(request);
  const response = NextResponse.redirect(new URL(safeRedirectPath(storedNext), publicOrigin));
  const secure = process.env.NODE_ENV === "production";
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NONCE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);

  response.cookies.set(
    USER_SESSION_COOKIE,
    createUserSessionToken(resolved.slackUserId, resolved.displayName, resolved.role),
    {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE_SEC,
    },
  );
  response.cookies.delete("kudos_admin_session_v2");

  return response;
}
