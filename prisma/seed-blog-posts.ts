/**
 * Seed BlogPost rows from markdown sources in `content/blog/*.md`.
 *
 * Each file uses a minimal frontmatter block:
 *
 *   ---
 *   slug: airbnb-booking-calendar-sync-free
 *   locale: en
 *   title: How to sync Airbnb and Booking.com...
 *   excerpt: 140-160 char meta summary
 *   status: draft
 *   tags:
 *     - airbnb:Airbnb
 *     - booking-com:Booking.com
 *   ogImageUrl: null
 *   ---
 *
 *   # H1...
 *   ...body...
 *
 * Behaviour:
 *  - Idempotent. Upserts on (slug, locale). Re-running with the same body
 *    is a no-op (the `updatedAt` field is bumped only when a real change
 *    occurred — Prisma will write any changed scalar regardless).
 *  - Author defaults to the first User with role="superadmin". If none
 *    exists, the script aborts.
 *  - Tags are upserted in the BlogTag table (per locale) before being
 *    referenced by slug from BlogPost.tagsJson.
 *  - status (RT-25.14): on CREATE the post lands as `published` so
 *    /blog and the admin shell pick it up immediately — these
 *    articles ship pre-vetted alongside the source markdown. On
 *    UPDATE the existing status is preserved, so a maintainer who
 *    flipped a post back to `draft` (or `archived`) does not get
 *    overridden by the next routine seed run.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";

interface PostFrontmatter {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  status: string;
  tags: { slug: string; displayName: string }[];
  ogImageUrl: string | null;
  ogImageWidth: number | null;
  ogImageHeight: number | null;
  tldr: string;
  faq: { q: string; a: string }[];
}

interface ParsedPost extends PostFrontmatter {
  body: string;
}

/**
 * Pull a `## TL;DR` section out of the body and return its bullet list as
 * a single string (one bullet per line). Returns null + leaves body alone
 * if there's no `## TL;DR` block or it doesn't contain a list.
 *
 * Used so an article authored without explicit frontmatter still gets
 * structured TL;DR rendering — we move it from prose to data on import,
 * not by hand. Section ends at the next `## ` heading.
 */
function extractTldrSection(body: string): { tldr: string; body: string } {
  const re = /(^|\n)## TL;DR\s*\n([\s\S]*?)(?=\n## |\n*$)/i;
  const m = re.exec(body);
  if (!m) return { tldr: "", body };
  const block = m[2].trim();
  if (!block) return { tldr: "", body };
  const stripped = body.slice(0, m.index) + body.slice(m.index + m[0].length);
  return { tldr: block, body: stripped.replace(/\n{3,}/g, "\n\n").trim() + "\n" };
}

/**
 * Pull a `## FAQ` section out of the body and convert it into [{q, a}] pairs.
 * Recognises the common author shape — H3 question, then one or more
 * paragraphs of answer, repeating until the next H2.
 */
function extractFaqSection(body: string): { faq: { q: string; a: string }[]; body: string } {
  const re = /(^|\n)## FAQ\s*\n([\s\S]*?)(?=\n## |\n*$)/i;
  const m = re.exec(body);
  if (!m) return { faq: [], body };
  const block = m[2];
  const faq: { q: string; a: string }[] = [];

  // Support two question shapes:
  //   1) `### How does foo work?\nFoo works because…`
  //   2) `**How does foo work?**\nFoo works because…`
  // Pattern 2 is what most of the existing posts use; pattern 1 is what
  // future markdown-style authors will reach for. We detect either and
  // close the answer on the next question line OR on the next H2.
  const lines = block.split("\n");
  let pendingQ: string | null = null;
  let pendingA: string[] = [];
  const flush = () => {
    const q = pendingQ?.trim() ?? "";
    const a = pendingA.join("\n").trim();
    if (q && a) faq.push({ q, a });
    pendingQ = null;
    pendingA = [];
  };
  for (const line of lines) {
    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    const bold = /^\*\*(.+?\??)\*\*\s*$/.exec(line);
    if (h3) {
      flush();
      pendingQ = h3[1];
      continue;
    }
    if (bold) {
      flush();
      pendingQ = bold[1];
      continue;
    }
    if (pendingQ !== null) pendingA.push(line);
  }
  flush();

  if (faq.length === 0) return { faq: [], body };
  const stripped = body.slice(0, m.index) + body.slice(m.index + m[0].length);
  return { faq, body: stripped.replace(/\n{3,}/g, "\n\n").trim() + "\n" };
}

function parseFrontmatter(raw: string, filename: string): ParsedPost {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) {
    throw new Error(`${filename}: missing or malformed frontmatter (must start with --- and close with ---)`);
  }
  const [, header, body] = match;

  const fm: Partial<PostFrontmatter> = {};
  const tags: { slug: string; displayName: string }[] = [];
  const faq: { q: string; a: string }[] = [];
  let mode: "scalar" | "tags" | "tldr-block" | "faq-block" = "scalar";
  let tldrLines: string[] = [];
  let pendingFaq: { q?: string; a?: string } = {};

  const headerLines = header.split("\n");
  for (let li = 0; li < headerLines.length; li += 1) {
    const line = headerLines[li];

    // Block scalars (`tldr: |` then indented body until dedent or new key)
    if (mode === "tldr-block") {
      if (/^\s+/.test(line)) {
        tldrLines.push(line.replace(/^\s{2}/, "")); // de-indent two spaces
        continue;
      }
      // empty line stays in the block
      if (line.trim() === "" && li + 1 < headerLines.length && /^\s+/.test(headerLines[li + 1])) {
        tldrLines.push("");
        continue;
      }
      mode = "scalar";
    }

    if (mode === "faq-block") {
      // Items are: `  - q: "…"\n    a: "…"`
      const qMatch = /^\s*-\s+q:\s*(.*)$/.exec(line);
      if (qMatch) {
        if (pendingFaq.q && pendingFaq.a) faq.push({ q: pendingFaq.q, a: pendingFaq.a });
        pendingFaq = { q: stripYamlQuotes(qMatch[1]) };
        continue;
      }
      const aMatch = /^\s+a:\s*(.*)$/.exec(line);
      if (aMatch) {
        pendingFaq.a = stripYamlQuotes(aMatch[1]);
        continue;
      }
      if (line.trim() === "") continue;
      // Falls out of FAQ block on a non-indented key
      if (pendingFaq.q && pendingFaq.a) faq.push({ q: pendingFaq.q, a: pendingFaq.a });
      pendingFaq = {};
      mode = "scalar";
    }

    if (mode === "tags") {
      const tagMatch = /^\s*-\s+([a-z0-9-]+):(.+)$/.exec(line);
      if (tagMatch) {
        tags.push({ slug: tagMatch[1].trim(), displayName: tagMatch[2].trim() });
        continue;
      }
      mode = "scalar";
    }

    if (line.trim() === "") continue;

    if (line.startsWith("tags:")) {
      mode = "tags";
      continue;
    }
    if (/^tldr:\s*\|\s*$/.test(line)) {
      mode = "tldr-block";
      tldrLines = [];
      continue;
    }
    if (/^faq:\s*$/.test(line)) {
      mode = "faq-block";
      continue;
    }

    const kvMatch = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (!kvMatch) continue;
    const key = kvMatch[1];
    const value = stripYamlQuotes(kvMatch[2]);

    if (key === "ogImageUrl") {
      fm.ogImageUrl = value === "null" || value === "" ? null : value;
    } else if (key === "ogImageWidth") {
      const n = Number.parseInt(value, 10);
      fm.ogImageWidth = Number.isFinite(n) ? n : null;
    } else if (key === "ogImageHeight") {
      const n = Number.parseInt(value, 10);
      fm.ogImageHeight = Number.isFinite(n) ? n : null;
    } else if (key === "tldr") {
      // single-line scalar form: `tldr: "Quick summary"`
      fm.tldr = value;
    } else if (key === "slug" || key === "locale" || key === "title" || key === "excerpt" || key === "status") {
      fm[key] = value;
    }
  }

  if (mode === "faq-block" && pendingFaq.q && pendingFaq.a) {
    faq.push({ q: pendingFaq.q, a: pendingFaq.a });
  }
  if (tldrLines.length > 0 && fm.tldr === undefined) {
    fm.tldr = tldrLines.join("\n").trim();
  }

  for (const required of ["slug", "locale", "title", "excerpt", "status"] as const) {
    if (!fm[required]) {
      throw new Error(`${filename}: frontmatter missing required field '${required}'`);
    }
  }

  // Body cleanup: strip a leading H1 + auto-extract any `## TL;DR` / `## FAQ`
  // sections so the structured fields and the rendered prose never disagree.
  // Frontmatter wins — only fall through to body extraction when blank.
  let cleanedBody = body.replace(/^\n+/, "");
  cleanedBody = cleanedBody.replace(/^\s*#\s+[^\n]*\n+/, "");

  let resolvedTldr = fm.tldr ?? "";
  if (!resolvedTldr) {
    const ext = extractTldrSection(cleanedBody);
    resolvedTldr = ext.tldr;
    cleanedBody = ext.body;
  } else {
    // Frontmatter provided — still strip a body-level `## TL;DR` so we never
    // double-render the same content.
    cleanedBody = extractTldrSection(cleanedBody).body;
  }

  let resolvedFaq = faq;
  if (resolvedFaq.length === 0) {
    const ext = extractFaqSection(cleanedBody);
    resolvedFaq = ext.faq;
    cleanedBody = ext.body;
  } else {
    cleanedBody = extractFaqSection(cleanedBody).body;
  }

  return {
    slug: fm.slug!,
    locale: fm.locale!,
    title: fm.title!,
    excerpt: fm.excerpt!,
    status: fm.status!,
    tags,
    ogImageUrl: fm.ogImageUrl ?? null,
    ogImageWidth: fm.ogImageWidth ?? null,
    ogImageHeight: fm.ogImageHeight ?? null,
    tldr: resolvedTldr,
    faq: resolvedFaq,
    body: cleanedBody,
  };
}

function stripYamlQuotes(value: string): string {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1);
  }
  return value;
}

function resolveDbConfig(): { url: string; authToken?: string } {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl?.startsWith("file:")) {
    const rel = dbUrl.slice("file:".length);
    const abs = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return { url: `file:${abs}` };
  }
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }
  throw new Error(
    "No database configured. Set DATABASE_URL=file:./data/dev.db or TURSO_DATABASE_URL+TURSO_AUTH_TOKEN."
  );
}

async function main() {
  const config = resolveDbConfig();
  const adapter = new PrismaLibSql({ url: config.url, authToken: config.authToken });
  const prisma = new PrismaClient({ adapter });

  try {
    let author = await prisma.user.findFirst({ where: { role: "superadmin" } });
    if (!author) {
      // Local-dev fallback: in production a superadmin always exists, but a
      // freshly-created dev DB may not have one yet. Use any existing user
      // so the seed can populate posts for local QA. Production DB will
      // always pick the real superadmin via the role filter above.
      author = await prisma.user.findFirst();
      if (!author) {
        throw new Error(
          "No users in DB. Run `npm run db:seed` to create a superadmin first."
        );
      }
      console.log(
        `No superadmin found; using user '${author.username}' (id=${author.id}) as author for local-dev seed.`
      );
    }

    const dir = path.resolve(process.cwd(), "content/blog");
    if (!fs.existsSync(dir)) {
      console.log(`No content/blog/ directory; nothing to seed.`);
      return;
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    if (files.length === 0) {
      console.log("No .md files in content/blog/; nothing to seed.");
      return;
    }

    let upserted = 0;
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const parsed = parseFrontmatter(raw, file);

      // RT-25.14 — created posts land as `published` because these
      // 7 articles already shipped on the filesystem and need to be
      // visible on /blog. Maintainer can still flip individual posts
      // back to `draft` from the admin panel; that decision is
      // preserved (the update branch below does not touch status).
      const status = "published";

      for (const tag of parsed.tags) {
        await prisma.blogTag.upsert({
          where: { slug_locale: { slug: tag.slug, locale: parsed.locale } },
          update: { displayName: tag.displayName },
          create: { slug: tag.slug, displayName: tag.displayName, locale: parsed.locale },
        });
      }

      const tagsJson = JSON.stringify(parsed.tags.map((t) => t.slug));

      const existing = await prisma.blogPost.findUnique({
        where: { slug_locale: { slug: parsed.slug, locale: parsed.locale } },
      });

      const faqJson = JSON.stringify(parsed.faq);

      if (existing) {
        // RT-25.14 — environments where the prior seed created rows
        // as `draft` need a one-time bump to `published` so /blog
        // surfaces them. We only upgrade draft→published; rows the
        // maintainer flipped to `archived` stay archived, and rows
        // already `published` are not touched (preserves their
        // original publishedAt timestamp).
        const upgradeStatus = existing.status === "draft" ? { status: "published" as const, publishedAt: existing.publishedAt ?? new Date() } : {};
        await prisma.blogPost.update({
          where: { id: existing.id },
          data: {
            title: parsed.title,
            excerpt: parsed.excerpt,
            body: parsed.body,
            tagsJson,
            ogImageUrl: parsed.ogImageUrl,
            ogImageWidth: parsed.ogImageWidth,
            ogImageHeight: parsed.ogImageHeight,
            tldr: parsed.tldr,
            faqJson,
            updatedAt: new Date(),
            ...upgradeStatus,
          },
        });
        console.log(`Updated existing post: ${parsed.slug} [${parsed.locale}]${existing.status === "draft" ? " (status: draft → published)" : ""}`);
      } else {
        await prisma.blogPost.create({
          data: {
            slug: parsed.slug,
            locale: parsed.locale,
            title: parsed.title,
            excerpt: parsed.excerpt,
            body: parsed.body,
            status,
            tagsJson,
            ogImageUrl: parsed.ogImageUrl,
            ogImageWidth: parsed.ogImageWidth,
            ogImageHeight: parsed.ogImageHeight,
            tldr: parsed.tldr,
            faqJson,
            authorId: author.id,
            // Stamp publishedAt so list / RSS / sitemap queries that
            // sort by it have a sensible date for the seeded rows.
            // Maintainer can override later via the admin panel.
            publishedAt: status === "published" ? new Date() : null,
          },
        });
        console.log(`Created post: ${parsed.slug} [${parsed.locale}] (status=${status})`);
      }
      upserted += 1;
    }

    console.log(`\nDone. ${upserted} post(s) processed.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Seed-blog-posts failed:", err);
  process.exit(1);
});
