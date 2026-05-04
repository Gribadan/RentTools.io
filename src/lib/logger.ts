type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  level?: LogLevel;
  msg: string;
  [field: string]: unknown;
}

const isProd = process.env.NODE_ENV === "production";

export function log(fields: LogFields): void {
  const { level = "info", msg, ...rest } = fields;
  const entry = { ts: new Date().toISOString(), level, msg, ...rest };

  if (isProd) {
    // Vercel collects stdout — emit one JSON line per record so it's grep-friendly.
    console.log(JSON.stringify(entry));
    return;
  }

  // Dev: print a human-readable single line.
  const tail = Object.keys(rest).length
    ? " " + Object.entries(rest)
        .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join(" ")
    : "";
  console.log(`[${level}] ${msg}${tail}`);
}
