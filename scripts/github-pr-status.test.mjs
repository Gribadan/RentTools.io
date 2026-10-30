import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizePr } from "./github-pr-status.mjs";

const check = (name, conclusion = "SUCCESS", status = "COMPLETED") => ({ name, conclusion, status });
const pr = (checks, extra = {}) => ({
  number: 1,
  headRefOid: "synthetic-revision",
  reviewDecision: "REVIEW_REQUIRED",
  mergeStateStatus: "BLOCKED",
  statusCheckRollup: checks,
  ...extra,
});

test("a successful build cannot hide missing security analysis or owner review", () => {
  const result = summarizePr(pr([check("Build + tests")]));
  assert.equal(result.build, "passed");
  assert.equal(result.codeql, "missing");
  assert.equal(result.review, "REVIEW_REQUIRED");
});

test("neutral and skipped CodeQL results are not passed scans", () => {
  for (const conclusion of ["NEUTRAL", "SKIPPED"]) {
    assert.equal(summarizePr(pr([check("CodeQL", conclusion)])).codeql, "unverified");
  }
});

test("analysis jobs without a processed CodeQL result remain unverified", () => {
  assert.equal(summarizePr(pr([
    check("CodeQL (actions)"), check("CodeQL (javascript-typescript)"),
  ])).codeql, "unverified");
});

test("a failed analyzer takes precedence over an earlier successful result", () => {
  assert.equal(summarizePr(pr([
    check("CodeQL"), check("CodeQL (actions)", "FAILURE"),
  ])).codeql, "failed");
});

test("queued analysis is pending even when the previous result succeeded", () => {
  assert.equal(summarizePr(pr([
    check("CodeQL"), check("CodeQL (javascript-typescript)", null, "QUEUED"),
  ])).codeql, "pending");
});

test("a skipped release image on a PR does not turn passed checks into a failure", () => {
  const result = summarizePr(pr([
    check("Build + tests"), check("CodeQL"), check("CodeQL (actions)"),
    check("CodeQL (javascript-typescript)"), check("ARM64 release image", "SKIPPED"),
  ], { reviewDecision: "APPROVED", mergeStateStatus: "CLEAN" }));
  assert.equal(result.build, "passed");
  assert.equal(result.codeql, "passed");
  assert.equal(result.review, "APPROVED");
});

test("changes requested are kept separate from successful CI", () => {
  const result = summarizePr(pr([check("Build + tests"), check("CodeQL")], {
    reviewDecision: "CHANGES_REQUESTED",
  }));
  assert.equal(result.build, "passed");
  assert.equal(result.review, "CHANGES_REQUESTED");
});

test("cancelled builds fail and absent review data stays unknown", () => {
  const result = summarizePr(pr([check("Build + tests", "CANCELLED")], {
    reviewDecision: null, mergeStateStatus: null,
  }));
  assert.equal(result.build, "failed");
  assert.equal(result.review, "UNKNOWN");
  assert.equal(result.mergeState, "UNKNOWN");
});
