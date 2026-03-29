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

export async function createCategoryAction(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const quotaRaw = String(formData.get("quota") ?? "").trim();
  if (!key || !name) {
    redirect("/admin/categories?error=" + encodeURIComponent("Key and name are required."));
  }
  const monthlyQuota = quotaRaw === "" ? null : Number(quotaRaw);
  if (quotaRaw !== "" && (!Number.isInteger(monthlyQuota) || monthlyQuota! <= 0)) {
    redirect("/admin/categories?error=" + encodeURIComponent("Quota must be a positive whole number or left empty."));
  }
  try {
    await adminJson("/admin/user-categories", {
      method: "POST",
      body: JSON.stringify({ key, name, monthlyQuota }),
    });
  } catch (e) {
    redirect("/admin/categories?error=" + encodeURIComponent(e instanceof Error ? e.message : "Request failed"));
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/quotas");
  redirect("/admin/categories?notice=" + encodeURIComponent("Category created."));
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const quotaRaw = String(formData.get("quota") ?? "").trim();
  if (!id) {
    redirect("/admin/categories?error=" + encodeURIComponent("Missing category."));
  }
  if (!name) {
    redirect("/admin/categories?error=" + encodeURIComponent("Name is required."));
  }
  const monthlyQuota = quotaRaw === "" ? null : Number(quotaRaw);
  if (quotaRaw !== "" && (!Number.isInteger(monthlyQuota) || monthlyQuota! <= 0)) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent("Quota must be a positive whole number or left empty for workspace default."),
    );
  }
  try {
    await adminJson(`/admin/user-categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name, monthlyQuota }),
    });
  } catch (e) {
    redirect("/admin/categories?error=" + encodeURIComponent(e instanceof Error ? e.message : "Request failed"));
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/quotas");
  redirect("/admin/categories?notice=" + encodeURIComponent("Category updated."));
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("categoryId") ?? "").trim();
  if (!id) {
    redirect("/admin/categories?error=" + encodeURIComponent("Missing category."));
  }
  try {
    await adminJson(`/admin/user-categories/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (e) {
    redirect("/admin/categories?error=" + encodeURIComponent(e instanceof Error ? e.message : "Request failed"));
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/quotas");
  redirect("/admin/categories?notice=" + encodeURIComponent("Category deleted."));
}
