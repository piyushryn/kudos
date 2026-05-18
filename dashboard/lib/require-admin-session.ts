import { redirect } from "next/navigation";

import { requireUserSession } from "@/lib/require-user-session";

export async function requireAdminSession(
  redirectNext = "/leaderboard",
): Promise<{ slackUserId: string; displayName: string; role: "admin" | "super_admin" }> {
  const session = await requireUserSession(redirectNext);
  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect("/admin/login?next=" + encodeURIComponent(redirectNext));
  }

  return {
    slackUserId: session.slackUserId,
    displayName: session.displayName,
    role: session.role,
  };
}
