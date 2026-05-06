/**
 * One-shot generator for blog cover images.
 *
 * Pulls Gemini 2.5 Flash Image, runs each PNG output through sharp for
 * resize-to-1600w + webp@82 (matches the upload API's pipeline), writes
 * to public/blog-covers/<slug>.webp, and rewrites the matching markdown
 * file's frontmatter ogImageUrl + ogImageWidth/Height fields.
 *
 * Usage: GEMINI_API_KEY=… node scripts/generate-blog-covers.mjs
 *
 * Idempotent: re-running regenerates every cover (we WANT the option to
 * iterate on prompts), but the output filename is stable per slug so the
 * frontmatter stays in sync without churn.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY before running.");
  process.exit(1);
}
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const STYLE = `
Modern editorial illustration in a magazine cover style. 16:9 widescreen aspect ratio.
Clean geometric flat design with subtle gradient depth. Cream off-white background with
a soft warm radial gradient. Color palette: cream / off-white background, deep navy and
charcoal primary shapes, bright coral red (#FF385C) and warm amber accents.
Cinematic, premium, editorial illustration. No text, no logos, no people, no human faces,
no animals. One clear central concept. Generous negative space.`;

const POSTS = [
  {
    slug: "airbnb-booking-calendar-sync-free",
    concept:
      "Two stylized minimalist calendar grids floating in space, connected by a glowing curved arrow representing iCal data synchronization. A few highlighted date cells in coral red. A subtle silhouette of a small apartment building behind them in deep navy.",
  },
  {
    slug: "avoiding-double-bookings",
    concept:
      "Two semi-transparent calendar booking blocks overlapping on the same date, with a soft warning halo where they collide. A small house key icon resting on the calendar grid. Geometric, abstract, no alarm bells.",
  },
  {
    slug: "cleaning-buffer-days",
    concept:
      "A horizontal calendar week strip with seven cells. Two adjacent cells filled in deep navy (booked), one bright coral cell between them is the buffer day. A subtle vacuum or spray-bottle silhouette floating above the buffer cell. Minimal, infographic-style.",
  },
  {
    slug: "cleaning-schedule-automation",
    concept:
      "A clipboard with three checked-off list items, a small geometric broom, and a stopwatch icon arranged as a still life on a flat coral pedestal. Floating gears in soft amber suggest automation.",
  },
  {
    slug: "free-property-management-tools-2026",
    concept:
      "A flat-style toolbox open from the top, revealing four neatly arranged icons: a small key, a tiny calendar grid, a padlock, and a cleaning brush. The toolbox is deep navy with coral accents. A small price tag reading $0 hangs from the handle (no readable text, just the symbol shape).",
  },
  {
    slug: "gdpr-for-vacation-rental-hosts",
    concept:
      "A geometric shield silhouette in deep navy with a subtle ring of small stars (EU motif) curving around it. A small key shape floats inside the shield. Coral checkmark glow at the top. No text, no flags.",
  },
  {
    slug: "self-hosting-property-manager-droplet",
    concept:
      "A single stylized server rack tower (slim rectangle with horizontal slits and one glowing coral status LED) sitting on top of a rounded cloud-like platform. A tiny house silhouette perched on top of the server. Deep navy server, cream cloud, coral accents.",
  },
];

const FRONTMATTER_DIR = "content/blog";
const OUT_DIR = "public/blog-covers";
const PUBLIC_PREFIX = "/blog-covers";

mkdirSync(OUT_DIR, { recursive: true });

async function generateOne(post) {
  const prompt = `${STYLE}\n\nConcept: ${post.concept}`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        // Default Gemini image is 1024x1024; ratio cue lives in the prompt.
        // sharp resizes below.
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 400)}`);
  }
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(
    (p) => p?.inlineData?.data && p.inlineData.mimeType?.startsWith("image/")
  );
  if (!part) {
    throw new Error("No image data returned: " + JSON.stringify(data).slice(0, 400));
  }
  const buf = Buffer.from(part.inlineData.data, "base64");

  // Resize to 1600w (matches the runtime upload API), webp@82, strip metadata.
  // Force a 16:9 crop in case the model emits a square — extending the
  // canvas would add bands; cropping to 16:9 from center crops harmlessly.
  const meta = await sharp(buf).metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;
  const targetRatio = 16 / 9;
  const currentRatio = width / height;

  let pipeline = sharp(buf).rotate();
  if (Math.abs(currentRatio - targetRatio) > 0.01) {
    if (currentRatio > targetRatio) {
      const newW = Math.round(height * targetRatio);
      pipeline = pipeline.extract({
        left: Math.round((width - newW) / 2),
        top: 0,
        width: newW,
        height,
      });
    } else {
      const newH = Math.round(width / targetRatio);
      pipeline = pipeline.extract({
        left: 0,
        top: Math.round((height - newH) / 2),
        width,
        height: newH,
      });
    }
  }
  const webp = await pipeline
    .resize({ width: 1600, withoutEnlargement: false })
    .webp({ quality: 82 })
    .toBuffer();
  const finalMeta = await sharp(webp).metadata();
  const out = join(OUT_DIR, `${post.slug}.webp`);
  writeFileSync(out, webp);

  return {
    url: `${PUBLIC_PREFIX}/${post.slug}.webp`,
    width: finalMeta.width ?? 0,
    height: finalMeta.height ?? 0,
    bytes: webp.length,
  };
}

function rewriteFrontmatter(slug, info) {
  const path = join(FRONTMATTER_DIR, `${slug}.md`);
  const raw = readFileSync(path, "utf-8");
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) {
    console.warn(`[${slug}] no frontmatter found, skipping rewrite`);
    return;
  }
  let header = m[1];
  const body = m[2];

  const upsert = (key, value) => {
    const re = new RegExp(`^${key}:[^\\n]*$`, "m");
    if (re.test(header)) {
      header = header.replace(re, `${key}: ${value}`);
    } else {
      header = `${header}\n${key}: ${value}`;
    }
  };
  upsert("ogImageUrl", info.url);
  upsert("ogImageWidth", String(info.width));
  upsert("ogImageHeight", String(info.height));

  writeFileSync(path, `---\n${header}\n---\n${body}`);
  console.log(`[${slug}] frontmatter updated → ${info.url}`);
}

(async () => {
  for (const post of POSTS) {
    process.stdout.write(`Generating ${post.slug}…`);
    try {
      const info = await generateOne(post);
      console.log(` ok (${info.width}×${info.height}, ${(info.bytes / 1024).toFixed(0)} KB)`);
      rewriteFrontmatter(post.slug, info);
    } catch (err) {
      console.log(` FAIL`);
      console.error(`  ${err.message}`);
    }
  }
})();
