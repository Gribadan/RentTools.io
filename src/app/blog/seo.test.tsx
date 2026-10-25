import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/marketing-header", () => ({ MarketingHeader: () => null }));
vi.mock("@/lib/i18n/server", () => ({ getLocale: vi.fn(async () => "ru") }));
vi.mock("@/lib/seo", () => ({ applySeoOverrides: vi.fn(async (base) => base) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  blogPost: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
  blogTag: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => ({ slug: "tools", displayName: "Tools" })) },
} }));

import BlogIndexPage, { generateMetadata } from "./page";
import { generateMetadata as tagMetadata } from "./tag/[slug]/page";
import { prisma } from "@/lib/prisma";
import { applySeoOverrides } from "@/lib/seo";

beforeEach(() => vi.clearAllMocks());

describe("blog discovery", () => {
  it("keeps page two distinct in canonical and language alternatives", async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
    expect(metadata.alternates).toMatchObject({ canonical: "/ru/blog?page=2", languages: { en: "/blog?page=2", de: "/de/blog?page=2" } });
  });

  it("does not let landing overrides canonicalize page two to page one", async () => {
    vi.mocked(applySeoOverrides).mockImplementationOnce(async (base) => ({ ...base, alternates: { canonical: "/blog" } }));
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
    expect(metadata.alternates?.canonical).toBe("/ru/blog?page=2");
  });

  it("excludes filter combinations while retaining crawlable links", async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ tag: " Tools " }) });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("/ru/blog?tag=tools");
  });

  it("loads the translated catalogue and taxonomy for the requested language", async () => {
    await BlogIndexPage({ searchParams: Promise.resolve({}) });
    expect(prisma.blogPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ locale: "ru", status: "published" }) }));
    expect(prisma.blogTag.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { locale: "ru" } }));
  });

  it("preserves pagination on the English canonical of fallback tag pages", async () => {
    const metadata = await tagMetadata({ params: Promise.resolve({ slug: "tools" }), searchParams: Promise.resolve({ page: "3" }) });
    expect(metadata.alternates?.canonical).toBe("/blog/tag/tools?page=3");
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });
});
