import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  isDashboardAuthConfigured,
  verifySessionToken,
} from "@/lib/admin-session";

const PATH_HEADER = "x-dashboard-admin-path";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDashboardAuthConfigured()) {
    redirect(
      "/admin/login?error=" +
        encodeURIComponent(
          "Dashboard login is not configured. Set DASHBOARD_ADMIN_USERNAME, DASHBOARD_ADMIN_PASSWORD, and DASHBOARD_AUTH_SECRET (min 16 chars).",
        ),
    );
  }

  const secret = process.env.DASHBOARD_AUTH_SECRET!;
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifySessionToken(token, secret)) {
    const h = await headers();
    const next = h.get(PATH_HEADER) ?? "/admin";
    redirect("/admin/login?next=" + encodeURIComponent(next));
  }

  return children;
}
