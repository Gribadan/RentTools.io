import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { summarizeAudit } from "../../scripts/ci-audit-report.mjs";

function report(level: "moderate" | "high" | "critical" | null = null) {
  return {
    auditReportVersion: 2,
    metadata: { vulnerabilities: { moderate: 0, high: 0, critical: 0, ...(level ? { [level]: 1 } : {}) } },
    vulnerabilities: level ? {
      "example-sdk": {
        severity: level,
        range: "<2.0.1",
        via: [{ severity: level, title: "Example advisory", url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc" }],
      },
    } : {},
  };
}

describe("CI dependency audit diagnostics", () => {
  it("keeps clean and moderate-only audits passing at the existing high threshold", () => {
    for (const level of [null, "moderate"] as const) {
      const result = summarizeAudit(JSON.stringify(report(level)), 0);
      expect(result.exitCode).toBe(0);
      expect(result.annotations).toEqual([]);
      expect(result.markdown).toContain("audit passed");
    }
  });

  it.each(["high", "critical"] as const)("makes a %s failure readable without downloading job logs", (level) => {
    const result = summarizeAudit(JSON.stringify(report(level)), 1);
    expect(result.exitCode).toBe(1);
    expect(result.annotations[0]).toContain(`${level}: example-sdk (<2.0.1)`);
    expect(result.markdown).toContain("https://github.com/advisories/GHSA-aaaa-bbbb-cccc");
    expect(result.markdown).toContain("does not deploy production");
  });

  it("cannot turn blocking findings green even if the supplied npm status is zero", () => {
    expect(summarizeAudit(JSON.stringify(report("critical")), 0).exitCode).toBe(1);
  });

  it.each(["not json", "{}", JSON.stringify({ error: { code: "EAI_AGAIN" } })])("keeps an unavailable or malformed audit closed", (text) => {
    const result = summarizeAudit(text, 1);
    expect(result.exitCode).toBe(1);
    expect(result.annotations[0]).toContain("audit unavailable");
    expect(result.markdown).not.toContain("audit passed");
  });

  it("preserves npm failure when no vulnerability details are available", () => {
    expect(summarizeAudit(JSON.stringify(report()), 1).exitCode).toBe(1);
  });

  it("prevents advisory text from injecting a second workflow command", () => {
    const input = report("critical");
    input.vulnerabilities["example-sdk"]!.via[0].title = "Example\n::notice::unexpected%value";
    const result = summarizeAudit(JSON.stringify(input), 1);
    expect(result.annotations[0]).not.toContain("\n");
    expect(result.annotations[0]).toContain("%0A::notice::unexpected%25value");
  });

  it("writes the job summary and exits unsuccessfully for a real CLI invocation", () => {
    const directory = mkdtempSync(join(tmpdir(), "ci-audit-"));
    try {
      const input = join(directory, "audit.json");
      const summary = join(directory, "summary.md");
      writeFileSync(input, JSON.stringify(report("critical")));
      const result = spawnSync(process.execPath, [resolve("scripts/ci-audit-report.mjs"), input, "1"], {
        encoding: "utf8",
        env: { ...process.env, GITHUB_STEP_SUMMARY: summary },
      });
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("::error title=Dependency audit::critical: example-sdk");
      expect(readFileSync(summary, "utf8")).toContain("## Dependency audit failed");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
