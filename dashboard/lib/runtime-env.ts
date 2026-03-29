/**
 * Next.js inlines static `process.env.NAME` at build time. During `docker build`
 * those vars are usually unset, so Compose-provided values never appear at runtime.
 * Dynamic lookup keeps values read when the process starts (e.g. in Docker).
 */
export function runtimeEnv(name: string): string | undefined {
  return process.env[name];
}
