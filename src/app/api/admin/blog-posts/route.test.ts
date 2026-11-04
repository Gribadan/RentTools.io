import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/blog-publishing-auth", () => ({ requireBlogPublisher: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { blogPost: { findUnique: vi.fn(), create: vi.fn() } } }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
import { requireBlogPublisher } from "@/lib/blog-publishing-auth";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_LOCALES } from "@/lib/i18n/alternates";
import { POST } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireBlogPublisher).mockResolvedValue({ session: { userId: 1, username: "synthetic-author", role: "superadmin" }, response: null });
  vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.blogPost.create).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => ({ ...data, id: 1, createdAt: new Date(), updatedAt: null, publishedAt: null })) as never);
});
const create = (locale: string) => POST(new NextRequest("https://renttools.io/api/admin/blog-posts", {
  method: "POST", body: JSON.stringify({ title: "Synthetic draft", slug: "synthetic-draft", locale }),
}));

it.each(SUPPORTED_LOCALES)("creates an unpublished draft in %s", async (locale) => {
  expect((await create(locale)).status).toBe(201);
  expect(prisma.blogPost.create).toHaveBeenCalledWith({ data: expect.objectContaining({ locale, status: "draft", body: "", authorId: 1 }) });
});

it("rejects unsupported locales before writing", async () => {
  expect((await create("unsupported")).status).toBe(400);
  expect(prisma.blogPost.create).not.toHaveBeenCalled();
});

it("does not overwrite a conflicting existing article", async () => {
  vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: 42 } as never);
  expect((await create("en")).status).toBe(409);
  expect(prisma.blogPost.create).not.toHaveBeenCalled();
});
