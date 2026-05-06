/**
 * Single-post cover generator. Same pipeline as generate-blog-covers.mjs
 * (Gemini 2.5 Flash Image → sharp → 1600×900 webp@82) but takes the slug
 * and concept on the CLI so the daily-post routine can ship one cover at
 * a time without editing the POSTS array.
 *
 * Usage:
 *   GEMINI_API_KEY=… node scripts/generate-blog-covers-one.mjs \
 *     --slug=length-of-stay-discount-math \
 *     --concept="A horizontal week strip with seven cells, two at the right shaded coral, suggesting a discount."
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY (or GOOGLE_GEMINI_API_KEY) before running.");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a, true];
  })
);

const slug = args.slug;
const concept = args.concept;
if (!slug || !concept) {
  console.error("Required: --slug=<slug> --concept=\"<one-sentence concept>\"");
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

const FRONTMATTER_DIR = "content/blog";
const OUT_DIR = "public/blog-covers";
const PUBLIC_PREFIX = "/blog-covers";

mkdirSync(OUT_DIR, { recursive: true });

async function generateOne(slug, concept) {
  const prompt = `${STYLE}\n\nConcept: ${concept}`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
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
    throw new Error("NO_IMAGE: " + JSON.stringify(data).slice(0, 400));
  }
  const buf = Buffer.from(part.inlineData.data, "base64");

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
  const out = join(OUT_DIR, `${slug}.webp`);
  writeFileSync(out, webp);
  return {
    url: `${PUBLIC_PREFIX}/${slug}.webp`,
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
  process.stdout.write(`Generating ${slug}…`);
  try {
    const info = await generateOne(slug, concept);
    console.log(` ok (${info.width}×${info.height}, ${(info.bytes / 1024).toFixed(0)} KB)`);
    rewriteFrontmatter(slug, info);
  } catch (err) {
    console.log(` FAIL`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }
})();
