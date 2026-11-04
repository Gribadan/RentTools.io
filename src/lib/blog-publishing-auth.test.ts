import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", () => ({ requireSuperadmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireBlogPublisher } from "./blog-publishing-auth";
import { isBlogPublishingRequest } from "./blog-publishing-path";

afterEach(() => vi.unstubAllEnvs());
const credential = "x".repeat(48);
const request = (path = "/api/admin/blog-posts", method = "POST", value = credential) =>
  new Request("https://renttools.io" + path, { method, headers: { authorization: "Bearer " + value } });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BLOG_PUBLISH_TOKEN", credential);
  vi.stubEnv("BLOG_PUBLISH_USER_ID", "1");
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, username: "synthetic-author", role: "superadmin", suspendedAt: null } as never);
});

it("uses existing session authentication when no bearer is sent", async () => {
  await requireBlogPublisher(new Request("https://renttools.io/api/admin/blog-posts"));
  expect(requireSuperadmin).toHaveBeenCalledOnce();
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
});

it("allows the configured active publisher and preserves audit attribution", async () => {
  expect(await requireBlogPublisher(request())).toEqual({ session: { userId: 1, username: "synthetic-author", role: "superadmin" }, response: null });
});

it.each(["", "incorrect", credential + "extra"])("refuses an invalid bearer", async (value) => {
  expect((await requireBlogPublisher(request(undefined, undefined, value))).response?.status).toBe(401);
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
});

it.each(["BLOG_PUBLISH_TOKEN", "BLOG_PUBLISH_USER_ID"])("fails closed without %s", async (key) => {
  vi.stubEnv(key, "");
  expect((await requireBlogPublisher(request())).response?.status).toBe(401);
});

it.each([null, { id: 1, role: "user", suspendedAt: null }, { id: 1, role: "superadmin", suspendedAt: new Date() }])("refuses missing, demoted or suspended accounts", async (user) => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
  expect((await requireBlogPublisher(request())).response?.status).toBe(401);
});

it.each([
  ["/api/admin/users", "GET"], ["/api/admin/blog-posts/1", "DELETE"],
  ["/api/admin/blog-tags/1", "PATCH"], ["/api/admin/blog-posts/1/translation-link", "DELETE"],
  ["/api/admin/blog-posts/1/other", "POST"], ["/api/admin/blog-posts/1.1", "PATCH"],
  ["/api/admin/blog-images", "GET"], ["/api/admin/blog-posts/01", "PATCH"],
])("cannot authenticate outside its exact publishing surface: %s %s", async (path, method) => {
  expect(isBlogPublishingRequest(path, method)).toBe(false);
  expect((await requireBlogPublisher(request(path, method))).response?.status).toBe(401);
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
});
