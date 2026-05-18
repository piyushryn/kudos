import { headers } from "next/headers";

import { requireAdminSession } from "@/lib/require-admin-session";

const PATH_HEADER = "x-dashboard-admin-path";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const next = h.get(PATH_HEADER) ?? "/admin";
  await requireAdminSession(next);

  return children;
}
