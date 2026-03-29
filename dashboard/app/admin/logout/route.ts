import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
