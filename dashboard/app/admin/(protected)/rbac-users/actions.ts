"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/require-admin-session";
import { runtimeEnv } from "@/lib/runtime-env";

const dashboardApiBase = () => (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

export async function patchUserRoleAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession("/admin/rbac-users");
  if (session.role !== "super_admin") {
    redirect("/admin");
  }

  const slackUserId = String(formData.get("slackUserId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!slackUserId || (role !== "user" && role !== "admin")) {
    redirect("/admin/rbac-users?error=" + encodeURIComponent("Invalid role update request."));
  }

  const res = await fetch(`${dashboardApiBase()}/admin/rbac/users/${encodeURIComponent(slackUserId)}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ role }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    redirect(
      "/admin/rbac-users?error=" +
        encodeURIComponent(text || `Failed to update role for ${slackUserId} (${res.status}).`),
    );
  }

  revalidatePath("/admin/rbac-users");
  redirect("/admin/rbac-users?notice=" + encodeURIComponent(`Updated ${slackUserId} role to ${role}.`));
}
