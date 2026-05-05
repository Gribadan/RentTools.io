import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BODY_LEN = 3000;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
    }

    const limit = checkRateLimit(`blog-comment:${session.userId}`, 5, 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "You're commenting too quickly. Try again in a minute." },
        { status: 429 }
      );
    }

    const json = await request.json().catch(() => null);
    const postId = Number(json?.postId);
    const body = typeof json?.body === "string" ? json.body.trim() : "";

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "Invalid post" }, { status: 400 });
    }
    if (!body) {
      return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });
    }
    if (body.length > MAX_BODY_LEN) {
      return NextResponse.json(
        { error: `Comment must be ${MAX_BODY_LEN} characters or fewer` },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!post || post.status !== "published" || !post.publishedAt || post.publishedAt > new Date()) {
      return NextResponse.json({ error: "Post not available" }, { status: 404 });
    }

    const comment = await prisma.blogComment.create({
      data: {
        postId,
        userId: session.userId,
        body,
        status: "visible",
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ id: comment.id, createdAt: comment.createdAt });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
