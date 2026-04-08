import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE_SEC, createAdminSessionToken, isSlackAdmin } from "@/lib/admin-session";
import { runtimeEnv } from "@/lib/runtime-env";
import { USER_SESSION_COOKIE, USER_SESSION_MAX_AGE_SEC, createUserSessionToken } from "@/lib/user-session";

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

const safeRedirectPath = (candidate: string | undefined): string => {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/leaderboard";
  }
  return candidate;
};

const failedAuthRedirect = (request: Request, message: string) =>
  NextResponse.redirect(
    new URL(`/admin/login?error=${encodeURIComponent(message)}`, request.url),
  );

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
  const response = NextResponse.redirect(new URL(safeRedirectPath(storedNext), request.url));
  const secure = process.env.NODE_ENV === "production";
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NONCE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);

  response.cookies.set(USER_SESSION_COOKIE, createUserSessionToken(slackUserId, displayName), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE_SEC,
  });

  if (isSlackAdmin(slackUserId)) {
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(slackUserId), {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SEC,
    });
  } else {
    response.cookies.delete(ADMIN_SESSION_COOKIE);
  }

  return response;
}
