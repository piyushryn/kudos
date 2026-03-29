"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  adminPasswordMatches,
  createSessionToken,
} from "@/lib/admin-session";

function sanitizeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? ""));

  if (!adminPasswordMatches(password)) {
    redirect(
      "/admin/login?error=" +
        encodeURIComponent("Wrong password.") +
        "&next=" +
        encodeURIComponent(next),
    );
  }

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  redirect(next);
}
