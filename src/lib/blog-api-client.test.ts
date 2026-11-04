import { afterEach, expect, it } from "vitest";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const fixtures: string[] = [];
afterEach(() => { for (const dir of fixtures.splice(0)) {
  if (path.dirname(path.resolve(dir)) !== path.resolve(tmpdir()) || !path.basename(dir).startsWith("blog-api-client-")) throw new Error("Unexpected fixture cleanup path");
  rmSync(dir, { recursive: true, force: true });
} });

it("publishes five translations through HTTP only, resumes idempotently and refuses unowned existing posts", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "blog-api-client-")); fixtures.push(root);
  for (const dir of ["content/blog", "public/blog-covers", "src/lib/i18n", "prisma"]) mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of ["src/lib/i18n/alternates.ts", "prisma/seed-blog-posts.ts"]) copyFileSync(file, path.join(root, file));
  const locales = ["en", "ru", "de", "fr", "es"];
  for (const locale of locales) writeFileSync(path.join(root, "content/blog/synthetic-article" + (locale === "en" ? "" : "." + locale) + ".md"), `---\nslug: synthetic-article\nlocale: ${locale}\ntitle: Synthetic article\nexcerpt: Synthetic description\nstatus: published\nogImageUrl: /blog-covers/synthetic-article.webp\nogImageWidth: 1600\nogImageHeight: 900\ntldr: |\n  - Synthetic summary\n---\n\n## Example\n\nSynthetic content.\n`);
  const cover = await sharp({ create: { width: 1600, height: 900, channels: 3, background: "#eee8dc" } }).webp().toBuffer();
  writeFileSync(path.join(root, "public/blog-covers/synthetic-article.webp"), cover);
  const uploaded = await sharp(cover).rotate().webp({ quality: 82 }).toBuffer();
  const rows: Record<string, unknown>[] = [];
  const token = "z".repeat(48);
  let mutations = 0;
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const url = req.url!; const method = req.method!;
    const send = (body: unknown, status = 200) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    if (url.startsWith("/uploads/blog/")) { res.writeHead(200, { "content-type": "image/webp" }); res.end(uploaded); return; }
    if (req.headers.authorization !== "Bearer " + token) { send({}, 401); return; }
    if (method !== "GET") mutations++;
    if (url === "/api/admin/blog-images") { send({ url: "/uploads/blog/" + "a".repeat(32) + ".webp", width: 1600, height: 900 }); return; }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    if (url === "/api/admin/blog-tags") { send([]); return; }
    if (url === "/api/admin/blog-posts") {
      if (method === "GET") send(rows);
      else { const row = { ...body, id: rows.length + 1, body: "", status: "draft", translationGroupId: null }; rows.push(row); send(row, 201); }
      return;
    }
    if (url === "/api/admin/blog-posts/bulk-status") {
      for (const row of rows) if (body.ids.includes(row.id)) Object.assign(row, { status: body.status, publishedAt: new Date().toISOString() });
      send({ skipped: [], updated: rows.length }); return;
    }
    const match = /^\/api\/admin\/blog-posts\/(\d+)(\/translation-link)?$/.exec(url);
    if (!match) { send({}, 404); return; }
    const row = rows.find(r => r.id === Number(match[1]))!;
    if (match[2]) { row.translationGroupId = row.id; rows.find(r => r.id === body.otherPostId)!.translationGroupId = row.id; send({ success: true }); }
    else { if (method === "PATCH") Object.assign(row, body); send(row); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const script = path.resolve("scripts/publish-blog-api.mjs");
  const run = (publish: boolean) => new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [script, "synthetic-article", ...(publish ? ["--publish"] : [])], { cwd: root, env: { ...process.env, BLOG_PUBLISH_TOKEN: token, BLOG_PUBLISH_ORIGIN: "http://127.0.0.1:" + port } });
    let output = ""; child.stdout.on("data", b => { output += b; }); child.stderr.on("data", b => { output += b; }); child.on("error", reject); child.on("exit", code => resolve({ code, output }));
  });
  try {
    const preflight = await run(false); expect(preflight.code, preflight.output).toBe(0); expect(mutations).toBe(0);
    const first = await run(true); expect(first.output).not.toContain(token); expect(first.code, first.output).toBe(0);
    expect(rows).toHaveLength(5); expect(rows.every(r => r.status === "published" && r.translationGroupId === 1)).toBe(true);
    expect((await run(true)).code).toBe(0); expect(rows).toHaveLength(5);
    rows.push({ id: 42, slug: "synthetic-article", locale: "de", status: "published" });
    const before = mutations;
    expect((await run(true)).code).not.toBe(0); expect(mutations).toBe(before);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}, 20_000);
