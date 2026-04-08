"use server";

import { redirect } from "next/navigation";

function sanitizeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export async function loginAction(formData: FormData): Promise<void> {
  const next = sanitizeNext(String(formData.get("next") ?? ""));
  redirect(`/auth/slack/login?next=${encodeURIComponent(next)}`);
}
