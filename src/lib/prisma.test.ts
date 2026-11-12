import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let directory: string;
let databaseFile: string;
let result: { shared: boolean; pageWrite: { count?: number; errorCode?: string }; counter: number };

beforeAll(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "renttools-prisma-test-"));
  databaseFile = path.join(directory, "synthetic.db");
  // A child releases native transaction handles on exit, including on Windows.
  const script = `
    const modulePath = process.argv[1];
    const syncClient = require(modulePath).prisma;
    delete require.cache[require.resolve(modulePath)];
    const pageClient = require(modulePath).prisma;
    (async () => {
      await syncClient.$executeRawUnsafe('CREATE TABLE "SyntheticCounter" (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)');
      await syncClient.$executeRawUnsafe('INSERT INTO "SyntheticCounter" VALUES (1, 0)');
      let pageWrite;
      await syncClient.$transaction(async transaction => {
        await transaction.$queryRawUnsafe('SELECT value FROM "SyntheticCounter" WHERE id = 1');
        pageWrite = pageClient.$executeRawUnsafe('UPDATE "SyntheticCounter" SET value = value + 1 WHERE id = 1')
          .then(count => ({ count }), error => ({ errorCode: error.code }));
        await new Promise(resolve => setImmediate(resolve));
        await transaction.$executeRawUnsafe('UPDATE "SyntheticCounter" SET value = value + 1 WHERE id = 1');
      });
      const write = await pageWrite;
      const rows = await syncClient.$queryRawUnsafe('SELECT value FROM "SyntheticCounter" WHERE id = 1');
      console.log(JSON.stringify({ shared: syncClient === pageClient, pageWrite: write, counter: Number(rows[0].value) }));
      for (const client of new Set([syncClient, pageClient])) await client.$disconnect();
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const output = execFileSync(process.execPath, [
    "--import", "tsx", "-e", script, path.resolve("src/lib/prisma.ts"),
  ], {
    env: { ...process.env, NODE_ENV: "production", DATABASE_URL: `file:${databaseFile}` },
    encoding: "utf-8",
    timeout: 15_000,
  });
  result = JSON.parse(output.trim());
}, 20_000);

afterAll(() => {
  fs.rmSync(databaseFile, { force: true });
  fs.rmdirSync(directory);
});

describe("production database clients across route bundles", () => {
  it("reuses the production client when another bundle loads the database module", () => {
    expect(result.shared).toBe(true);
  });

  it("queues another bundle's write until an interactive transaction commits", () => {
    expect(result.pageWrite).toEqual({ count: 1 });
    expect(result.counter).toBe(2);
  });
});
