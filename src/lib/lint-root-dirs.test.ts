import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { Linter } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { getRootDirs } = require("@next/eslint-plugin-next/dist/utils/get-root-dirs") as {
  getRootDirs: (context: { cwd: string; settings: { next?: { rootDir?: unknown } } }) => string[];
};
const root = mkdtempSync(path.join(tmpdir(), "next-lint-roots-"));
for (const name of ["web", "admin", "api"]) mkdirSync(path.join(root, name));
writeFileSync(path.join(root, "README.md"), "synthetic fixture");
const normalize = (paths: string[]) => paths.map((p) => path.resolve(p).replaceAll("\\", "/")).sort();

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("Next lint root-directory glob contract", () => {
  it("uses the current directory without a root setting", () => {
    expect(getRootDirs({ cwd: root, settings: {} })).toEqual([root]);
  });

  it("expands directory globs without including files", () => {
    expect(normalize(getRootDirs({ cwd: root, settings: { next: { rootDir: `${root}/*` } } })))
      .toEqual(normalize(["admin", "api", "web"].map((name) => path.join(root, name))));
  });

  it("supports root arrays, braces and Windows separators", () => {
    expect(normalize(getRootDirs({ cwd: root, settings: { next: {
      rootDir: [`${root}/{admin,web}`, path.join(root, "api"), null],
    } } }))).toEqual(normalize(["admin", "api", "web"].map((name) => path.join(root, name))));
  });

  it("still finds pages when the actual lint rule consumes a configured glob", () => {
    mkdirSync(path.join(root, "web", "pages"));
    writeFileSync(path.join(root, "web", "pages", "index.js"), "export default function Page() {}");
    const plugin = require("@next/eslint-plugin-next");
    const linter = new Linter();
    const messages = linter.verify("const link = <a href='/'>Home</a>;", {
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { next: plugin },
      settings: { next: { rootDir: `${root}/{web,admin}` } },
      rules: { "next/no-html-link-for-pages": "error" },
    });
    expect(messages.map((message) => message.ruleId)).toEqual(["next/no-html-link-for-pages"]);
  });
});
