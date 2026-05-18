import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getBackendCookieHeaders } from "@/lib/backend-auth";
import { runtimeEnv } from "@/lib/runtime-env";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

export type UserSession = {
  slackUserId: string;
  displayName: string;
  role: "user" | "admin" | "super_admin";
};

const apiBase = () => (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

export async function resolveSessionFromApi(): Promise<UserSession | null> {
  const response = await fetch(`${apiBase()}/user/me/session`, {
    headers: await getBackendCookieHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as UserSession;
}

export async function requireUserSession(redirectNext = "/me"): Promise<UserSession> {
  const jar = await cookies();
  if (!jar.get(USER_SESSION_COOKIE)?.value) {
    redirect(`/auth/slack/login?next=${encodeURIComponent(redirectNext)}`);
  }
  const session = await resolveSessionFromApi();
  if (!session) {
    redirect(`/auth/slack/login?next=${encodeURIComponent(redirectNext)}`);
  }

  return session;
}
