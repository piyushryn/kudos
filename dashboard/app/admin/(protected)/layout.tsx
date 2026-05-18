import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { USER_SESSION_COOKIE, verifyUserSessionToken } from "@/lib/user-session";

const PATH_HEADER = "x-dashboard-admin-path";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(USER_SESSION_COOKIE)?.value;
  const claims = verifyUserSessionToken(token);

  if (!claims || (claims.role !== "admin" && claims.role !== "super_admin")) {
    const h = await headers();
    const next = h.get(PATH_HEADER) ?? "/admin";
    redirect("/admin/login?next=" + encodeURIComponent(next));
  }

  return children;
}
