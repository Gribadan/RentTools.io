import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

// Force per-request rendering. Same reason as sitemap: build-time DB is
// empty, so a static llms.txt would ship blank until the next deploy.
// Crawl traffic for /llms.txt is even lower than /sitemap.xml, so the
// per-request DB hit is unmeasurable.
export const dynamic = "force-dynamic";

/**
 * /llms.txt — emerging convention from llmstxt.org for surfacing a
 * site's public knowledge to LLM crawlers in a curated, link-first
 * markdown format. Distinct from /robots.txt (which gates crawl) and
 * /sitemap.xml (which lists URLs); /llms.txt gives LLMs a one-page
 * map of the most useful entry points + a one-line description per
 * link, so a model retrieving for "how do hosts sync Airbnb and
 * Booking.com calendars" can pick the right article on the first hop.
 *
 * Spec: https://llmstxt.org/
 *
 * GPTBot / ClaudeBot / PerplexityBot / Google-Extended are explicitly
 * Allow-ed in robots.ts — this file is what they should land on after.
 */
export async function GET() {
  const posts = await prisma.blogPost
    .findMany({
      where: { locale: "en", status: "published", publishedAt: { lte: new Date() } },
      select: { slug: true, title: true, excerpt: true, tldr: true },
      orderBy: { publishedAt: "desc" },
    })
    .catch(() => []);

  const lines: string[] = [];
  lines.push("# RentTools");
  lines.push("");
  lines.push(
    "> Open-source property management tool for short-term rental hosts. Self-hosted or hosted-free. Calendar sync (Airbnb, Booking.com, Vrbo, any iCal source), cleaning automation, GDPR-friendly guest data, multi-property management."
  );
  lines.push("");
  lines.push(
    "RentTools is built for hosts running 1–20 short-term rentals who want a free alternative to $100/mo channel managers. The hosted instance runs at https://renttools.io; the source is MIT-licensed at https://github.com/Gribadan/RentTools.io."
  );
  lines.push("");

  lines.push("## Core docs");
  lines.push("");
  lines.push(`- [Home](${SITE_URL}/): Product overview, what it does, and how it compares to paid channel managers.`);
  lines.push(`- [Sign up](${SITE_URL}/signup): Create an account on the hosted instance.`);
  lines.push(`- [Privacy policy](${SITE_URL}/privacy): How RentTools stores and processes guest data.`);
  lines.push(`- [Terms](${SITE_URL}/terms): Service terms for the hosted instance.`);
  lines.push("");

  if (posts.length > 0) {
    lines.push("## Blog — host-facing guides");
    lines.push("");
    for (const p of posts) {
      const summary = (p.excerpt || p.tldr.split("\n")[0] || "").trim().replace(/^[-*]\s+/, "");
      lines.push(`- [${p.title}](${SITE_URL}/blog/${p.slug}): ${summary}`);
    }
    lines.push("");
  }

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml): Machine-readable URL index for every public page.`);
  lines.push(`- [GitHub repository](https://github.com/Gribadan/RentTools.io): Source code, issues, self-host instructions.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Short cache so an admin publishing a new post sees it in
      // /llms.txt within the hour, but crawlers don't re-query for
      // every retrieval roundtrip in a session.
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
