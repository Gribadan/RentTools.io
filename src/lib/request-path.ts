/** Remove bearer-style guest-form tokens before a path reaches normal logs. */
export function redactSensitiveRequestPath(pathname: string): string {
  return pathname
    .replace(/^\/g\/[^/]+(?=\/|$)/, "/g/[redacted]")
    .replace(/^\/api\/g\/[^/]+(?=\/|$)/, "/api/g/[redacted]");
}
