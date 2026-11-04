import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

// Uploads arrive after startup and live on persistent storage, outside the
// build-time public-file inventory. Keep the existing editor URLs stable.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[a-f0-9]{32}\.webp$/.test(filename)) {
    return new Response(null, { status: 404 });
  }
  try {
    const image = await readFile(path.join(process.cwd(), "public", "uploads", "blog", filename));
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(image.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
}
