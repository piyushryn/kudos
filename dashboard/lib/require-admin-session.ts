import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { USER_SESSION_COOKIE, verifyUserSessionToken } from "@/lib/user-session";

export async function requireAdminSession(
  redirectNext = "/leaderboard",
): Promise<{ slackUserId: string; displayName: string; role: "admin" | "super_admin"; token: string }> {
  const jar = await cookies();
  const token = jar.get(USER_SESSION_COOKIE)?.value;
  const claims = verifyUserSessionToken(token);
  if (!token || !claims || (claims.role !== "admin" && claims.role !== "super_admin")) {
    redirect("/admin/login?next=" + encodeURIComponent(redirectNext));
  }

  return {
    slackUserId: claims.slackUserId,
    displayName: claims.displayName,
    role: claims.role,
    token,
  };
}
