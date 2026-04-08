import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { USER_SESSION_COOKIE, verifyUserSessionToken } from "@/lib/user-session";

export type UserSession = {
  slackUserId: string;
  displayName: string;
  token: string;
};

export async function requireUserSession(redirectNext = "/me"): Promise<UserSession> {
  const jar = await cookies();
  const token = jar.get(USER_SESSION_COOKIE)?.value;
  const session = verifyUserSessionToken(token);
  if (!session || !token) {
    redirect(`/auth/slack/login?next=${encodeURIComponent(redirectNext)}`);
  }

  return {
    slackUserId: session.slackUserId,
    displayName: session.displayName,
    token,
  };
}
