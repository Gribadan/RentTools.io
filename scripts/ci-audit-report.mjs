import { appendFileSync, readFileSync } from "node:fs";
import { summarizeAudit } from "../src/lib/ci-audit-report.mjs";

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
