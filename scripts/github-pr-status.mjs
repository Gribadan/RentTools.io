// Read-only triage. Successful inspection does not authorize a merge or release.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function checkState(check) {
  if (!check) return "missing";
  if (check.status !== "COMPLETED") return "pending";
  if (check.conclusion === "SUCCESS") return "passed";
  if (["NEUTRAL", "SKIPPED"].includes(check.conclusion)) return "unverified";
  return "failed";
}

export function summarizePr(pr) {
  const checks = pr.statusCheckRollup ?? [];
  const build = checkState(checks.find((check) => check.name === "Build + tests"));
  const result = checks.find((check) => check.name === "CodeQL");
  const analyzers = checks.filter((check) => /^CodeQL \(/.test(check.name ?? ""));
  const states = [result, ...analyzers].filter(Boolean).map(checkState);
  let codeql = "missing";
  if (states.includes("failed")) codeql = "failed";
  else if (states.includes("pending")) codeql = "pending";
  else if (checkState(result) === "passed" && states.every((state) => state === "passed")) codeql = "passed";
  else if (states.length) codeql = "unverified";
  return {
    number: pr.number,
    url: pr.url,
    head: pr.headRefOid,
    build,
    codeql,
    review: pr.reviewDecision || "UNKNOWN",
    mergeState: pr.mergeStateStatus || "UNKNOWN",
    draft: pr.isDraft,
    notes: [
      ...(codeql === "unverified" ? ["CodeQL neutral/skipped or analysis jobs alone do not prove a processed security result."] : []),
      ...(pr.reviewDecision === "REVIEW_REQUIRED" ? ["Owner approval is a separate merge requirement; rerunning CI does not supply it."] : []),
      "ARM64 release image is intentionally skipped on pull requests; production needs separate release authorization.",
    ],
  };
}

function main(args) {
  const [number, option, repository] = args;
  if (!/^[1-9]\d*$/.test(number ?? "") || args.length !== 3 || option !== "--repo" ||
      !/^[\w.-]+\/[\w.-]+$/.test(repository ?? "")) {
    throw new Error("Usage: node scripts/github-pr-status.mjs <PR number> --repo <owner/repository>");
  }
  const raw = execFileSync("gh", [
    "pr", "view", number, "--repo", repository, "--json",
    "number,url,headRefOid,mergeStateStatus,reviewDecision,statusCheckRollup,isDraft",
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
  console.log(JSON.stringify(summarizePr(JSON.parse(raw)), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message?.startsWith("Usage:") ? error.message :
      "GitHub inspection failed. Check gh auth status and repository access; no changes were made.");
    process.exitCode = 1;
  }
}
