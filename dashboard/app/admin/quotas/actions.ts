"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function adminOrigin(): { base: string; token: string } {
  const base = (process.env.DASHBOARD_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const token = process.env.INTERNAL_API_TOKEN ?? "";
  if (!token) {
    throw new Error("INTERNAL_API_TOKEN is not set for the dashboard.");
  }
  return { base, token };
}

async function adminJson(path: string, init: RequestInit): Promise<unknown> {
  const { base, token } = adminOrigin();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: string }).error)
        : text || res.statusText;
    throw new Error(msg);
  }
  return body;
}

export async function assignUserCategoryFormAction(formData: FormData): Promise<void> {
  const slackUserId = String(formData.get("slackUserId") ?? "").trim();
  const userCategoryId = String(formData.get("userCategoryId") ?? "").trim();
  if (!slackUserId || !userCategoryId) {
    redirect("/admin/quotas?error=" + encodeURIComponent("Slack User ID and category are required."));
  }
  try {
    await adminJson(`/admin/users/${encodeURIComponent(slackUserId)}/category`, {
      method: "PATCH",
      body: JSON.stringify({ userCategoryId }),
    });
  } catch (e) {
    redirect("/admin/quotas?error=" + encodeURIComponent(e instanceof Error ? e.message : "Request failed"));
  }
  revalidatePath("/admin/quotas");
  redirect("/admin/quotas?notice=" + encodeURIComponent("Category updated for " + slackUserId));
}

export async function resetUserBalanceFormAction(formData: FormData): Promise<void> {
  const slackUserId = String(formData.get("slackUserId") ?? "").trim();
  if (!slackUserId) {
    redirect("/admin/quotas?error=" + encodeURIComponent("Slack User ID is required."));
  }
  try {
    await adminJson(`/admin/users/${encodeURIComponent(slackUserId)}/reset-balance`, {
      method: "POST",
    });
  } catch (e) {
    redirect("/admin/quotas?error=" + encodeURIComponent(e instanceof Error ? e.message : "Request failed"));
  }
  revalidatePath("/admin/quotas");
  redirect("/admin/quotas?notice=" + encodeURIComponent("Balance reset for " + slackUserId));
}

export async function bulkCategoryFormAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("slackUserIds") ?? "");
  const userCategoryId = String(formData.get("userCategoryId") ?? "").trim();
  const slackUserIds = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (slackUserIds.length === 0 || !userCategoryId) {
    redirect("/admin/quotas?error=" + encodeURIComponent("Add at least one Slack user ID and pick a category."));
  }
  try {
    const body = await adminJson("/admin/users/bulk-category", {
      method: "POST",
      body: JSON.stringify({ slackUserIds, userCategoryId }),
    });
    const updated =
      typeof body === "object" && body !== null && "updated" in body ? Number((body as { updated: number }).updated) : slackUserIds.length;
    revalidatePath("/admin/quotas");
    redirect("/admin/quotas?notice=" + encodeURIComponent(`Category applied (${updated} user row(s) updated).`));
  } catch (e) {
    redirect("/admin/quotas?error=" + encodeURIComponent(e instanceof Error ? e.message : "Request failed"));
  }
}

export async function resetAllBalancesAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await adminJson("/admin/balances/reset-all", { method: "POST" });
    revalidatePath("/admin/quotas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}
