import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Passed to server components so protected layouts can redirect back after login. */
const PATH_HEADER = "x-dashboard-admin-path";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
