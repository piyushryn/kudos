import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { runtimeEnv } from "@/lib/runtime-env";

const OAUTH_STATE_COOKIE = "kudos_slack_oauth_state";
const OAUTH_NEXT_COOKIE = "kudos_slack_oauth_next";
const OAUTH_NONCE_COOKIE = "kudos_slack_oauth_nonce";

const sanitizeNext = (raw: string | null): string => {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/leaderboard";
  }
  return raw;
};

const requiredEnv = (name: string): string => {
  const value = runtimeEnv(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = sanitizeNext(url.searchParams.get("next"));
  const state = randomBytes(24).toString("hex");
  const nonce = randomBytes(24).toString("hex");

  const authUrl = new URL("https://slack.com/openid/connect/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile");
  authUrl.searchParams.set("client_id", requiredEnv("SLACK_OIDC_CLIENT_ID"));
  authUrl.searchParams.set("redirect_uri", requiredEnv("SLACK_OIDC_REDIRECT_URI"));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);

  const response = NextResponse.redirect(authUrl);
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set(OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
