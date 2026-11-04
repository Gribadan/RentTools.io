import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSuperadmin, type RequireSuperadminResult } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlogPublishingRequest } from "@/lib/blog-publishing-path";

// Optional, revocable service credential. It cannot authenticate browser
// sessions or access any other admin API, nor delete existing content.
export async function requireBlogPublisher(request: Request): Promise<RequireSuperadminResult> {
  const authorization = request.headers.get("authorization");
  if (!authorization) return requireSuperadmin();
  const denied = () => ({
    session: null,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  });
  const expected = process.env.BLOG_PUBLISH_TOKEN;
  const userId = Number(process.env.BLOG_PUBLISH_USER_ID);
  if (!expected || expected.length < 32 || !Number.isSafeInteger(userId) || userId <= 0
    || !isBlogPublishingRequest(new URL(request.url).pathname, request.method)) return denied();
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(authorization), digest(`Bearer ${expected}`))) return denied();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true, suspendedAt: true },
  });
  if (!user || user.role !== "superadmin" || user.suspendedAt) return denied();
  return { session: { userId: user.id, username: user.username, role: user.role }, response: null };
}
