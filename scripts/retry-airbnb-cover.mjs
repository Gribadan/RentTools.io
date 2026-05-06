import { writeFileSync, readFileSync } from "node:fs";
import sharp from "sharp";

const API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

const prompt = `
Modern editorial illustration in a magazine cover style. 16:9 widescreen aspect ratio.
Cream off-white background with a soft warm radial gradient. Color palette: cream
background, deep navy and charcoal primary shapes, bright coral red and warm amber accents.
Flat design with subtle gradient depth. Cinematic, premium, no text, no logos, no people.

Concept: two stylized minimalist calendar grid icons floating side by side in space,
connected by a glowing curved arrow that flows from one to the other and back, suggesting
two-way data sync. A few cells in each calendar are highlighted in coral red. Geometric,
abstract, clean.`;

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  }),
});
const data = await res.json();
const part = data?.candidates?.[0]?.content?.parts?.find(
  (p) => p?.inlineData?.data && p.inlineData.mimeType?.startsWith("image/")
);
if (!part) {
  console.error("No image:", JSON.stringify(data).slice(0, 400));
  process.exit(1);
}
const buf = Buffer.from(part.inlineData.data, "base64");
const meta = await sharp(buf).metadata();
const targetRatio = 16 / 9;
const w = meta.width ?? 1024, h = meta.height ?? 1024;
const cur = w / h;
let p = sharp(buf).rotate();
if (Math.abs(cur - targetRatio) > 0.01) {
  if (cur > targetRatio) {
    const nw = Math.round(h * targetRatio);
    p = p.extract({ left: Math.round((w - nw) / 2), top: 0, width: nw, height: h });
  } else {
    const nh = Math.round(w / targetRatio);
    p = p.extract({ left: 0, top: Math.round((h - nh) / 2), width: w, height: nh });
  }
}
const webp = await p.resize({ width: 1600 }).webp({ quality: 82 }).toBuffer();
writeFileSync("public/blog-covers/airbnb-booking-calendar-sync-free.webp", webp);
const fm = await sharp(webp).metadata();
console.log("ok:", fm.width, fm.height, webp.length, "bytes");

const path = "content/blog/airbnb-booking-calendar-sync-free.md";
const raw = readFileSync(path, "utf-8");
const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
if (m) {
  let header = m[1];
  const body = m[2];
  const upsert = (k, v) => {
    const re = new RegExp(`^${k}:[^\\n]*$`, "m");
    header = re.test(header) ? header.replace(re, `${k}: ${v}`) : `${header}\n${k}: ${v}`;
  };
  upsert("ogImageUrl", "/blog-covers/airbnb-booking-calendar-sync-free.webp");
  upsert("ogImageWidth", String(fm.width));
  upsert("ogImageHeight", String(fm.height));
  writeFileSync(path, `---\n${header}\n---\n${body}`);
  console.log("frontmatter updated");
}
