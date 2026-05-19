import { NextRequest, NextResponse } from "next/server";

import { runtimeEnv } from "@/lib/runtime-env";

// Server-side proxy so the browser can reach Express backend endpoints
// (e.g. /public/leaderboard, /admin/audit-log) without nginx having to
// publicly expose them. The user's session cookies are forwarded so that
// the backend's RBAC middleware still authorizes admin endpoints exactly
// as it would for an internal server-side call.
//
// GET-only by design — state-changing admin actions go through Next.js
// server actions in lib/admin-api.ts.

const apiBaseUrl = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

type Params = Promise<{ path?: string[] }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { path = [] } = await params;
  const target = `${apiBaseUrl}/${path.join("/")}${req.nextUrl.search}`;

  const cookie = req.headers.get("cookie");
  const upstream = await fetch(target, {
    method: "GET",
    headers: {
      ...(cookie ? { cookie } : {}),
      accept: req.headers.get("accept") ?? "application/json",
    },
    cache: "no-store",
  });

  const body = await upstream.arrayBuffer();
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "no-store");

  return new NextResponse(body, { status: upstream.status, headers });
}
