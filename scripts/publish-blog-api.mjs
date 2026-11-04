import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
import sharp from 'sharp';

async function main() {
const slug = process.argv[2];
assert.match(slug ?? '', /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
assert.ok(process.argv.slice(3).every(x => x === '--publish'), 'Unexpected argument');
const publish = process.argv.includes('--publish');
const base = process.env.BLOG_PUBLISH_ORIGIN || 'https://renttools.io';
const origin = new URL(base);
assert.equal(origin.origin, base);
assert.ok(base === 'https://renttools.io' || (origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)), 'Refusing credential transmission to an unexpected origin');
const token = process.env.BLOG_PUBLISH_TOKEN || (process.env.BLOG_PUBLISH_TOKEN_FILE && fs.readFileSync(process.env.BLOG_PUBLISH_TOKEN_FILE, 'utf8').trim());
assert.ok(token && token.length >= 32, 'Private BLOG_PUBLISH_TOKEN or BLOG_PUBLISH_TOKEN_FILE is required');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const localeModule = ts.transpileModule(fs.readFileSync('src/lib/i18n/alternates.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { SUPPORTED_LOCALES: locales } = await import('data:text/javascript;base64,' + Buffer.from(localeModule).toString('base64'));
// Reuse only the seeder's pure parser functions. Never execute seeder main or access a DB.
const source = ts.createSourceFile('seed.ts', fs.readFileSync('prisma/seed-blog-posts.ts', 'utf8'), ts.ScriptTarget.Latest, true);
const names = new Set(['extractTldrSection', 'extractFaqSection', 'parseFrontmatter', 'stripYamlQuotes']);
const pure = source.statements.filter(n => ts.isFunctionDeclaration(n) && names.has(n.name?.text)).map(n => n.getText(source)).join('\n');
const parser = vm.createContext({});
vm.runInContext(ts.transpileModule(pure, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, parser);
const posts = locales.map(locale => {
  const filename = `${slug}${locale === 'en' ? '' : '.' + locale}.md`;
  const raw = fs.readFileSync(path.join('content/blog', filename), 'utf8').replaceAll('\r\n', '\n');
  const post = JSON.parse(JSON.stringify(parser.parseFrontmatter(raw, filename)));
  assert.equal(post.slug, slug); assert.equal(post.locale, locale);
  assert.equal(post.status, 'published'); assert.ok(post.title && post.excerpt && post.body && post.tldr);
  return { ...post, sourceHash: digest(raw) };
});
assert.equal(new Set(posts.map(p => p.ogImageUrl)).size, 1);
assert.match(posts[0].ogImageUrl, /^\/blog-covers\/[a-z0-9-]+\.webp$/);
const cover = fs.readFileSync(path.join('public', posts[0].ogImageUrl));
const dimensions = await sharp(cover).metadata();
assert.equal(dimensions.width, posts[0].ogImageWidth); assert.equal(dimensions.height, posts[0].ogImageHeight);
const expectedUpload = await sharp(cover, { failOn: 'error' }).rotate().webp({ quality: 82 }).toBuffer();
const receiptDir = '.local/editorial/api-publications';
const receiptPath = path.join(receiptDir, slug + '.json');
const identity = { slug, sourceHashes: Object.fromEntries(posts.map(p => [p.locale, p.sourceHash])), coverHash: digest(cover) };
let receipt = fs.existsSync(receiptPath) ? JSON.parse(fs.readFileSync(receiptPath, 'utf8')) : { ...identity, rows: {}, createdTags: [], startedAt: new Date().toISOString() };
assert.deepEqual({ slug: receipt.slug, sourceHashes: receipt.sourceHashes, coverHash: receipt.coverHash }, identity, 'Receipt belongs to different content');
const save = () => { fs.mkdirSync(receiptDir, { recursive: true }); fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 }); };
async function api(endpoint, method = 'GET', body) {
  const response = await fetch(base + endpoint, { method, redirect: 'error', headers: { authorization: `Bearer ${token}`, ...(body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}) }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  // Never include response bodies or request headers in exceptions: lists contain private author fields.
  assert.ok(response.ok, `Blog API ${method} ${endpoint} returned ${response.status}; resume from private receipt after resolving`);
  return response.json();
}
const list = await api('/api/admin/blog-posts');
assert.ok(Array.isArray(list));
const targets = list.filter(p => p.slug === slug);
for (const p of targets) assert.equal(receipt.rows[p.locale]?.id, p.id, 'Existing article is not owned by this receipt; refusing overwrite');
assert.ok(targets.every(p => locales.includes(p.locale)));
const tags = await api('/api/admin/blog-tags');
assert.ok(Array.isArray(tags));
if (!publish) {
  console.log(JSON.stringify({ preflight: true, slug, locales, cover: { width: dimensions.width, height: dimensions.height }, resumingRows: targets.length, mutation: false }));
  return;
}
save();
if (!receipt.cover) {
  const form = new FormData(); form.set('image', new Blob([cover], { type: 'image/webp' }), slug + '.webp');
  const uploaded = await api('/api/admin/blog-images', 'POST', form);
  assert.match(uploaded.url, /^\/uploads\/blog\/[a-f0-9]{32}\.webp$/);
  assert.equal(uploaded.width, dimensions.width); assert.equal(uploaded.height, dimensions.height);
  receipt.cover = uploaded; save();
}
const publicCover = await fetch(base + receipt.cover.url, { redirect: 'error' });
assert.ok(publicCover.ok, 'Uploaded cover is not publicly readable; keep drafts unpublished');
assert.equal(digest(Buffer.from(await publicCover.arrayBuffer())), digest(expectedUpload), 'Uploaded cover differs from expected WebP');
function payload(p) {
  return { title: p.title, slug: p.slug, locale: p.locale, excerpt: p.excerpt, body: p.body, tldr: p.tldr, faq: p.faq,
    tags: p.tags.map(t => t.slug), ogImageUrl: receipt.cover.url, ogImageWidth: receipt.cover.width, ogImageHeight: receipt.cover.height };
}
function check(actual, expected) {
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(actual[key], value, `Stored ${key} differs from approved source`);
}
for (const post of posts) {
  for (const tag of post.tags) {
    if (!tags.some(t => t.locale === post.locale && t.slug === tag.slug)) {
      const created = await api('/api/admin/blog-tags', 'POST', { locale: post.locale, slug: tag.slug, displayName: tag.displayName });
      tags.push(created); receipt.createdTags.push({ id: created.id, locale: post.locale, slug: tag.slug }); save();
    }
  }
  let row = receipt.rows[post.locale];
  if (!row) {
    const created = await api('/api/admin/blog-posts', 'POST', { title: post.title, slug, locale: post.locale, excerpt: post.excerpt });
    row = receipt.rows[post.locale] = { id: created.id, filled: false }; save();
  }
  const before = await api('/api/admin/blog-posts/' + row.id);
  assert.equal(before.slug, slug); assert.equal(before.locale, post.locale);
  assert.ok(before.status === 'draft' || (row.filled && before.status === 'published'), 'Recorded row has an unexpected status');
  const data = payload(post);
  if (row.filled) check(before, data);
  else {
    // Resume only an empty draft or a previous identical PATCH with a lost response.
    assert.ok(!before.body || before.body === data.body, 'Recorded draft has been edited; refusing overwrite');
    await api('/api/admin/blog-posts/' + row.id, 'PATCH', data);
    check(await api('/api/admin/blog-posts/' + row.id), data);
    row.filled = true; save();
  }
}
const anchor = receipt.rows[locales[0]].id;
for (const locale of locales.slice(1)) {
  const row = await api('/api/admin/blog-posts/' + receipt.rows[locale].id);
  if (row.translationGroupId !== anchor) await api(`/api/admin/blog-posts/${anchor}/translation-link`, 'POST', { otherPostId: row.id });
}
for (const post of posts) {
  const row = await api('/api/admin/blog-posts/' + receipt.rows[post.locale].id);
  check(row, payload(post)); assert.equal(row.translationGroupId, anchor);
}
const ids = locales.map(l => receipt.rows[l].id);
const result = await api('/api/admin/blog-posts/bulk-status', 'POST', { ids, status: 'published' });
assert.deepEqual(result.skipped, []);
for (const post of posts) {
  const row = await api('/api/admin/blog-posts/' + receipt.rows[post.locale].id);
  check(row, payload(post)); assert.equal(row.status, 'published'); assert.ok(row.publishedAt);
}
receipt.publishedAt = new Date().toISOString(); receipt.status = 'published'; receipt.applicationDeployRequired = false; save();
console.log(JSON.stringify({ published: true, slug, locales, receipt: receiptPath, applicationDeployRequired: false }));

}
await main();
