import { headers } from "next/headers";

export async function getBackendCookieHeaders(extraHeaders?: HeadersInit): Promise<HeadersInit> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");
  return {
    ...(cookie ? { cookie } : {}),
    ...(extraHeaders ?? {}),
  };
}
