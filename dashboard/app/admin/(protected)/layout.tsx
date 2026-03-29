import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

const PATH_HEADER = "x-dashboard-admin-path";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifySessionToken(token)) {
    const h = await headers();
    const next = h.get(PATH_HEADER) ?? "/admin";
    redirect("/admin/login?next=" + encodeURIComponent(next));
  }

  return children;
}
