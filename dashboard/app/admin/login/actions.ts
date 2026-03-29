"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  credentialsMatch,
  isDashboardAuthConfigured,
} from "@/lib/admin-session";

function sanitizeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export async function loginAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? ""));

  if (!isDashboardAuthConfigured()) {
    redirect(
      "/admin/login?error=" +
        encodeURIComponent("Login is not configured. Set dashboard env variables (see .env.example)."),
    );
  }

  const expectedUser = process.env.DASHBOARD_ADMIN_USERNAME ?? "";
  const expectedPass = process.env.DASHBOARD_ADMIN_PASSWORD ?? "";
  const secret = process.env.DASHBOARD_AUTH_SECRET ?? "";

  if (!credentialsMatch(username, password, expectedUser, expectedPass)) {
    redirect(
      "/admin/login?error=" +
        encodeURIComponent("Invalid username or password.") +
        "&next=" +
        encodeURIComponent(next),
    );
  }

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  redirect(next);
}
