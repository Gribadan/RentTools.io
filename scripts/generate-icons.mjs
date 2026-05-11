#!/usr/bin/env node
/**
 * One-off icon generation. Reads `public/icon.svg` (the canonical brand
 * mark) and emits the raster sizes Google + iOS + Lighthouse require.
 * Re-run after editing icon.svg; no PRs that touch the SVG should land
 * without re-running this script and committing the regenerated PNGs +
 * favicon.ico.
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
 *   - icon-192.png         — Android home-screen / PWA `purpose: any`
 *   - icon-512.png         — Android splash / Knowledge-Panel logo target
 *   - apple-touch-icon.png — iOS adds-to-home (180×180 is the canonical
 *     iOS size; iOS rounds the corners itself, so we ship a square).
 *   - src/app/favicon.ico  — Multi-resolution ICO (16/32/48 px) for the
 *     `/favicon.ico` legacy convention. Google Search results, every
 *     browser tab, every RSS reader still pulls this URL — and Next's
 *     App Router auto-serves the file at this exact path. Until this
 *     was regenerated, the create-next-app default (Vercel triangle)
 *     was what Google indexed.
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

// Build the multi-resolution favicon.ico. Format is well documented;
// the modern (Vista+) variant just packs PNG bytes inside an ICO
// container and every browser since IE11 supports it. We bundle 16, 32,
// and 48 to match what Google Search, Chrome tabs, and Windows desktop
// pickers pull at different DPI scales — single-size ICOs look blurry
// on hidpi monitors.
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
  icoSizes.map((size) =>
    sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 255, g: 56, b: 92, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
);

// ICO container layout:
//   ICONDIR        (6 bytes)
//   ICONDIRENTRY × N (16 bytes each)
//   PNG data       (concatenated, offsets recorded in ICONDIRENTRY)
const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;
const headerAndEntries = Buffer.alloc(HEADER_SIZE + ENTRY_SIZE * icoSizes.length);
// ICONDIR
headerAndEntries.writeUInt16LE(0, 0); // reserved
headerAndEntries.writeUInt16LE(1, 2); // type 1 = icon
headerAndEntries.writeUInt16LE(icoSizes.length, 4); // image count

let dataOffset = HEADER_SIZE + ENTRY_SIZE * icoSizes.length;
icoSizes.forEach((size, i) => {
  const png = icoPngs[i];
  const entryOffset = HEADER_SIZE + i * ENTRY_SIZE;
  // Width / height: 0 means 256 px in the ICO spec, so anything <256
  // can be written as the literal byte. We only ship ≤48 here.
  headerAndEntries.writeUInt8(size, entryOffset); // width
  headerAndEntries.writeUInt8(size, entryOffset + 1); // height
  headerAndEntries.writeUInt8(0, entryOffset + 2); // colour palette (0 = no palette / true colour)
  headerAndEntries.writeUInt8(0, entryOffset + 3); // reserved
  headerAndEntries.writeUInt16LE(1, entryOffset + 4); // planes
  headerAndEntries.writeUInt16LE(32, entryOffset + 6); // bit depth (RGBA)
  headerAndEntries.writeUInt32LE(png.length, entryOffset + 8); // bytes in resource
  headerAndEntries.writeUInt32LE(dataOffset, entryOffset + 12); // offset to PNG bytes
  dataOffset += png.length;
});

const icoBuf = Buffer.concat([headerAndEntries, ...icoPngs]);
const icoPath = resolve(repoRoot, "src", "app", "favicon.ico");
await writeFile(icoPath, icoBuf);
console.log(`wrote src/app/favicon.ico (${icoSizes.join("/")} px, ${icoBuf.length} bytes)`);

console.log("done");
