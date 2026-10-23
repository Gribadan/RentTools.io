import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const absent = "0".repeat(40);
const revision = "1".repeat(40);

function checkPush(refs: string) {
  const directory = mkdtempSync(join(tmpdir(), "push-policy-"));
  try {
    const input = join(directory, "refs");
    writeFileSync(input, refs);
    return spawnSync("git", ["-c", "core.hooksPath=.githooks", "hook", "run", `--to-stdin=${input}`, "pre-push", "--", "origin"], {
      encoding: "utf8",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("reviewed branch push policy", () => {
  it("allows creating a topic branch without contacting a remote", () => {
    const result = checkPush(`refs/heads/codex/example ${revision} refs/heads/codex/example ${absent}\n`);
    expect(result.status, result.stderr).toBe(0);
  });

  it("blocks publishing any local branch directly to master", () => {
    const result = checkPush(`refs/heads/codex/example ${revision} refs/heads/master ${revision}\n`);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("open a pull request");
  });

  it("blocks deleting master", () => {
    expect(checkPush(`(delete) ${absent} refs/heads/master ${revision}\n`).status).toBe(1);
  });

  it("rejects a mixed push containing a master update", () => {
    const result = checkPush(`refs/heads/codex/example ${revision} refs/heads/codex/example ${absent}\nrefs/heads/master ${revision} refs/heads/master ${revision}\n`);
    expect(result.status).toBe(1);
  });
});
