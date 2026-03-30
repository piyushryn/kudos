import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function requireAdminSession(redirectNext = "/leaderboard"): Promise<void> {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login?next=" + encodeURIComponent(redirectNext));
  }
}
