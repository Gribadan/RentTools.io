import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { log } from "@/lib/logger";

// Blog image upload — author flow used by the editor's image button.
// Images are written to `public/uploads/blog/` so Next's static handler
// can serve them at `/uploads/blog/<filename>` with no API round-trip.
//
// The directory is gitignored so `git reset --hard` on deploys (see
// scripts/install-build.sh) leaves uploads untouched. Backups happen
// out-of-band via the droplet's daily snapshot.
//
// Pipeline:
//   1. Multipart parse, single-file `image` field
//   2. Reject non-image MIME, > 10 MB, or unknown decoder
//   3. sharp re-encode → max 1600px wide, webp q82, strips EXIF
//   4. Random 16-char hex filename so the URL is non-guessable
//   5. Audit log + return public URL the editor inserts as `![](url)`

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1600;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif", // gif is decoded into a single frame; uploads of animated gifs lose animation
]);

export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form" }, { status: 400 });
  }

  const entry = form.get("image");
  if (!(entry instanceof File)) {
    return NextResponse.json({ error: "Field 'image' missing or not a file" }, { status: 400 });
  }
  if (entry.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image too large (${(entry.size / 1024 / 1024).toFixed(1)} MB > 10 MB limit)` },
      { status: 413 }
    );
  }
  if (entry.type && !ACCEPTED.has(entry.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${entry.type}. Use JPEG, PNG, WebP, or GIF.` },
      { status: 415 }
    );
  }

  const inputBuf = Buffer.from(await entry.arrayBuffer());

  let webp: Buffer;
  let dims: { width: number; height: number };
  try {
    const pipeline = sharp(inputBuf, { failOn: "error" }).rotate(); // honour EXIF orientation, then strip
    const meta = await pipeline.metadata();
    if (!meta.format) {
      return NextResponse.json({ error: "Could not decode image" }, { status: 415 });
    }
    const resizer = (meta.width ?? 0) > MAX_WIDTH
      ? pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
      : pipeline;
    webp = await resizer.webp({ quality: 82 }).toBuffer({ resolveWithObject: false });
    const finalMeta = await sharp(webp).metadata();
    dims = { width: finalMeta.width ?? 0, height: finalMeta.height ?? 0 };
  } catch (err) {
    log({
      level: "warn",
      msg: "blog_image_decode_failed",
      err: err instanceof Error ? err.message : String(err),
      userId: auth.session.userId,
    });
    return NextResponse.json({ error: "Could not process image" }, { status: 415 });
  }

  const filename = `${randomBytes(16).toString("hex")}.webp`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "blog");
  const fullPath = path.join(uploadsDir, filename);
  try {
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(fullPath, webp);
  } catch (err) {
    log({
      level: "error",
      msg: "blog_image_write_failed",
      err: err instanceof Error ? err.message : String(err),
      path: fullPath,
    });
    return NextResponse.json({ error: "Could not save image" }, { status: 500 });
  }

  const publicUrl = `/uploads/blog/${filename}`;

  // Audit row uses resourceId 0 because there's no BlogImage table yet —
  // we just want a record that this admin uploaded an asset and what
  // path it landed at, for moderation / cleanup purposes.
  await logAudit(auth.session.userId, "create", "blogPost", 0, {
    kind: "image",
    url: publicUrl,
    bytes: webp.length,
    width: dims.width,
    height: dims.height,
    sourceMime: entry.type || null,
    sourceBytes: entry.size,
  });

  return NextResponse.json({
    url: publicUrl,
    width: dims.width,
    height: dims.height,
    bytes: webp.length,
  });
}
