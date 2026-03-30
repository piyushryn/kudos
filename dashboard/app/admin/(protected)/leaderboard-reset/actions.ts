"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/require-admin-session";
import { runtimeEnv } from "@/lib/runtime-env";

const REVALIDATE = ["/leaderboard", "/admin/leaderboard-reset", "/admin/audit-log"] as const;

function adminOrigin(): { base: string; token: string } {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");
  const token = runtimeEnv("INTERNAL_API_TOKEN") ?? "";
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

function revalidateLeaderboardRelated(): void {
  for (const p of REVALIDATE) {
    revalidatePath(p);
  }
}

export async function resetLeaderboardAllAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminSession("/admin/leaderboard-reset");
  try {
    await adminJson("/admin/leaderboard/reset-all", { method: "POST" });
    revalidateLeaderboardRelated();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed." };
  }
}

export async function resetLeaderboardUserAction(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminSession("/admin/leaderboard-reset");
  const id = userId.trim();
  if (!id) {
    return { ok: false, error: "Missing user id." };
  }
  try {
    await adminJson("/admin/leaderboard/reset-user", {
      method: "POST",
      body: JSON.stringify({ userId: id }),
    });
    revalidateLeaderboardRelated();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed." };
  }
}

export async function resetLeaderboardBySlackAction(
  slackUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminSession("/admin/leaderboard-reset");
  const id = slackUserId.trim();
  if (!id) {
    return { ok: false, error: "Slack User ID is required." };
  }
  try {
    await adminJson("/admin/leaderboard/reset-user", {
      method: "POST",
      body: JSON.stringify({ slackUserId: id }),
    });
    revalidateLeaderboardRelated();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed." };
  }
}
