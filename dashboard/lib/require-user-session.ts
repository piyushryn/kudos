import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { runtimeEnv } from "@/lib/runtime-env";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

export type UserSession = {
  slackUserId: string;
  displayName: string;
  role: "user" | "admin" | "super_admin";
  token: string;
};

const apiBase = () => (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

export async function resolveSessionFromApi(
  token: string,
): Promise<Omit<UserSession, "token"> | null> {
  const response = await fetch(`${apiBase()}/user/me/session`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as Omit<UserSession, "token">;
}

export async function requireUserSession(redirectNext = "/me"): Promise<UserSession> {
  const jar = await cookies();
  const token = jar.get(USER_SESSION_COOKIE)?.value;
  if (!token) {
    redirect(`/auth/slack/login?next=${encodeURIComponent(redirectNext)}`);
  }
  const session = await resolveSessionFromApi(token);
  if (!session) {
    redirect(`/auth/slack/login?next=${encodeURIComponent(redirectNext)}`);
  }

  return {
    slackUserId: session.slackUserId,
    displayName: session.displayName,
    role: session.role,
    token,
  };
}
