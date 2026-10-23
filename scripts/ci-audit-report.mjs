import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function inline(value) {
  return String(value).replace(/[\r\n]+/g, " ").replace(/[\\`*\[\]<>|]/g, "\\$&");
}

function annotation(value) {
  return `::error title=Dependency audit::${value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A")}`;
}

export function summarizeAudit(text, npmExitCode) {
  let report;
  try {
    report = JSON.parse(text);
  } catch {
    report = null;
  }
  const counts = report?.metadata?.vulnerabilities;
  const valid = report?.auditReportVersion === 2 && !report.error &&
    ["moderate", "high", "critical"].every((level) => Number.isInteger(counts?.[level]) && counts[level] >= 0);
  if (!valid) {
    const message = "Dependency audit unavailable: npm did not return a valid audit report. Check registry access and rerun CI; the security gate remains closed.";
    return { exitCode: 1, markdown: `## Dependency audit unavailable\n\n${message}\n`, annotations: [annotation(message)] };
  }

  const blocked = counts.high + counts.critical;
  const failed = npmExitCode !== 0 || blocked > 0;
  const lines = [
    `## Dependency audit ${failed ? "failed" : "passed"}`,
    "",
    `${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate vulnerabilities.`,
  ];
  const annotations = [];
  for (const [name, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
    if (!["high", "critical"].includes(vulnerability.severity)) continue;
    const advisory = vulnerability.via?.find((entry) => typeof entry === "object" && ["high", "critical"].includes(entry.severity));
    const url = /^https:\/\/github\.com\/advisories\/GHSA-[a-z0-9-]+$/i.test(advisory?.url ?? "") ? advisory.url : "";
    const reason = `${vulnerability.severity}: ${name} (${vulnerability.range ?? "installed version"})${advisory?.title ? ` — ${advisory.title}` : ""}`;
    lines.push(`- ${inline(reason)}${url ? ` ([advisory](${url}))` : ""}`);
    annotations.push(annotation(`${reason}${url ? ` ${url}` : ""}`));
  }
  if (failed) {
    if (annotations.length === 0) annotations.push(annotation("npm audit failed; inspect the dependency audit summary and registry response."));
    lines.push("", "Update affected dependencies and package-lock.json, then rerun CI. The ARM64 release image requires successful checks; this workflow does not deploy production.");
  }
  return { exitCode: failed ? 1 : 0, markdown: lines.join("\n") + "\n", annotations };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , reportPath, status] = process.argv;
  let text = "";
  try {
    text = readFileSync(reportPath, "utf8");
  } catch {
    // A missing report must fail the gate just like an unavailable registry.
  }
  const result = summarizeAudit(text, Number(status));
  console.log(result.markdown);
  for (const message of result.annotations) console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.markdown);
  process.exitCode = result.exitCode;
}
