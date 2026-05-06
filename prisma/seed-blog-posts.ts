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
}

interface ParsedPost extends PostFrontmatter {
  body: string;
}

function parseFrontmatter(raw: string, filename: string): ParsedPost {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) {
    throw new Error(`${filename}: missing or malformed frontmatter (must start with --- and close with ---)`);
  }
  const [, header, body] = match;

  const fm: Partial<PostFrontmatter> = {};
  const tags: { slug: string; displayName: string }[] = [];
  let inTagsBlock = false;

  for (const line of header.split("\n")) {
    if (line.trim() === "") continue;
    if (inTagsBlock) {
      const tagMatch = /^\s*-\s+([a-z0-9-]+):(.+)$/.exec(line);
      if (tagMatch) {
        tags.push({ slug: tagMatch[1].trim(), displayName: tagMatch[2].trim() });
        continue;
      }
      inTagsBlock = false;
    }
    if (line.startsWith("tags:")) {
      inTagsBlock = true;
      continue;
    }
    const kvMatch = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (!kvMatch) continue;
    const key = kvMatch[1];
    let value = kvMatch[2];
    // Strip surrounding YAML quotes — `title: "..."` and `title: '...'`
    // are both valid scalar forms; prior runs preserved the quotes
    // verbatim and shipped them into the rendered <title>.
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    if (key === "ogImageUrl") {
      fm.ogImageUrl = value === "null" || value === "" ? null : value;
    } else if (key === "slug" || key === "locale" || key === "title" || key === "excerpt" || key === "status") {
      fm[key] = value;
    }
  }

  for (const required of ["slug", "locale", "title", "excerpt", "status"] as const) {
    if (!fm[required]) {
      throw new Error(`${filename}: frontmatter missing required field '${required}'`);
    }
  }

  return {
    slug: fm.slug!,
    locale: fm.locale!,
    title: fm.title!,
    excerpt: fm.excerpt!,
    status: fm.status!,
    tags,
    ogImageUrl: fm.ogImageUrl ?? null,
    body: body.replace(/^\n+/, ""),
  };
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
