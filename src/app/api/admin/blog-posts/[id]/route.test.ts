import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/auth", () => ({ requireSuperadmin: vi.fn() }));
vi.mock("@/lib/blog-publishing-auth", () => ({ requireBlogPublisher: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { blogPost: { findUnique: vi.fn(), update: vi.fn() } } }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
import { requireBlogPublisher } from "@/lib/blog-publishing-auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

const slug = "maintenance-calendar-hold-reopening";
const existing = { id: 1, slug, locale: "en", title: "Synthetic", excerpt: "Before", body: "", tldr: "", faqJson: "[]", tagsJson: "[]", status: "draft", authorId: 1, createdAt: new Date(), updatedAt: null, publishedAt: null, author: null, _count: { comments: 0 } };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireBlogPublisher).mockResolvedValue({ session: { userId: 1, username: "synthetic-author", role: "superadmin" }, response: null });
  vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(existing as never);
  vi.mocked(prisma.blogPost.update).mockResolvedValue({ ...existing, excerpt: "After" } as never);
});

it("does not truncate an existing long slug when filling the post", async () => {
  const response = await PATCH(new NextRequest("https://renttools.io/api/admin/blog-posts/1", {
    method: "PATCH", body: JSON.stringify({ slug, excerpt: "After" }),
  }), { params: Promise.resolve({ id: "1" }) });
  expect(response.status).toBe(200);
  expect(prisma.blogPost.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.not.objectContaining({ slug: expect.anything() }) }));
  expect((await response.json()).slug).toBe(slug);
});
