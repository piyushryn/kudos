import { readFileSync } from "node:fs";

/**
 * Next can compile server code so `process.env` is a build-time snapshot (often
 * missing Docker-injected vars). On Linux (including Docker), the live process
 * environment is readable from /proc/self/environ.
 */
let procEnviron: Map<string, string> | null | undefined;

function loadProcEnviron(): Map<string, string> | undefined {
  if (procEnviron !== undefined) {
    return procEnviron === null ? undefined : procEnviron;
  }
  if (process.platform !== "linux") {
    procEnviron = null;
    return undefined;
  }
  try {
    const buf = readFileSync("/proc/self/environ");
    const m = new Map<string, string>();
    let start = 0;
    for (let i = 0; i <= buf.length; i++) {
      if (i === buf.length || buf[i] === 0) {
        if (i > start) {
          const line = buf.subarray(start, i).toString("utf8");
          const eq = line.indexOf("=");
          if (eq > 0) {
            m.set(line.slice(0, eq), line.slice(eq + 1));
          }
        }
        start = i + 1;
      }
    }
    procEnviron = m;
    return m;
  } catch {
    procEnviron = null;
    return undefined;
  }
}

export function runtimeEnv(name: string): string | undefined {
  const fromProc = loadProcEnviron()?.get(name);
  if (fromProc !== undefined) {
    return fromProc;
  }
  return process.env[name];
}
