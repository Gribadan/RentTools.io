#!/usr/bin/env node
/**
 * One-off icon generation. Reads `public/icon.svg` (the canonical brand
 * mark) and emits the raster sizes Google + iOS + Lighthouse require.
 * Re-run after editing icon.svg; no PRs that touch the SVG should land
 * without re-running this script and committing the regenerated PNGs.
 *
 * Why we need PNGs at all when we already ship an SVG: Google's
 * Organization structured-data spec requires the `logo` URL to point
 * at a PNG, JPG, or GIF — SVG is explicitly unsupported. Without a
 * raster logo at a Google-acceptable URL, the Knowledge Panel and
 * Sitelinks fall back to whatever Google last crawled. On a domain
 * that was previously hosted on Vercel, that fallback is sometimes
 * Vercel's default favicon — exactly the symptom this fix is for.
 *
 * Sizes ship:
 *   - icon-192.png — Android home-screen / PWA `purpose: any`
 *   - icon-512.png — Android splash / Knowledge-Panel logo target
 *   - apple-touch-icon.png — iOS adds-to-home (180×180 is the canonical
 *     iOS size; iOS rounds the corners itself, so we ship a square).
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const svgPath = resolve(repoRoot, "public", "icon.svg");

const targets = [
  { size: 192, file: "icon-192.png" },
  { size: 512, file: "icon-512.png" },
  { size: 180, file: "apple-touch-icon.png" },
];

const svg = await readFile(svgPath);

for (const t of targets) {
  const out = resolve(repoRoot, "public", t.file);
  await sharp(svg, { density: 384 }) // density bump = sharper rasterisation
    .resize(t.size, t.size, { fit: "contain", background: { r: 255, g: 56, b: 92, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${t.file} (${t.size}×${t.size})`);
}

console.log("done");
