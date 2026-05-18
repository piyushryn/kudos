import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { USER_SESSION_COOKIE } from "@/lib/user-session";

const LEGACY_ADMIN_SESSION_COOKIE = "kudos_admin_session_v2";

const publicOriginFromRequest = (request: Request): string => {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
};

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(LEGACY_ADMIN_SESSION_COOKIE);
  jar.delete(USER_SESSION_COOKIE);
  return NextResponse.redirect(new URL("/admin/login", publicOriginFromRequest(request)));
}
