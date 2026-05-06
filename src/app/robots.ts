import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isStagingHost } from "@/lib/seo-host";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

/**
 * Dynamic robots.txt (RT-18.2). Uses the Host header to decide whether
 * we're serving the production hostname or a staging mirror. Staging /
 * preview hosts return a blanket Disallow so search engines never index
 * them — this covers staging.renttools.io and any DigitalOcean preview
 * URL the build pipeline might surface.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers();

  if (isStagingHost(hdrs.get("host"))) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }

  return {
    rules: [
      // Default policy for every other bot — crawl public surfaces,
      // skip authenticated/private/token-gated paths.
      {
        userAgent: "*",
        allow: "/",
        // /api  — JSON, no SEO value, would only burn crawl budget.
        // /dashboard, /admin — auth-walled; redirects to /login.
        // /invite/, /g/ — one-time tokens; must NEVER be indexed because
        //                  each URL exposes private data (manager invite
        //                  or guest form share). Per-route layout.tsx
        //                  also emits noindex meta as belt-and-suspenders.
        disallow: ["/api/", "/dashboard", "/admin", "/invite/", "/g/"],
      },
      // Explicit Allow lines for major LLM training + retrieval crawlers.
      // We *want* RentTools content cited in AI answers — every blog
      // article is a host-facing how-to that's the right surface for a
      // "how do I sync my Airbnb to Booking.com" prompt to land on. The
      // disallow list mirrors the wildcard policy so private routes still
      // stay out of LLM corpora.
      ...["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "Google-Extended", "PerplexityBot", "Perplexity-User", "Applebot-Extended", "Bytespider", "CCBot", "cohere-ai"].map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/dashboard", "/admin", "/invite/", "/g/"],
      })),
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
    host: SITE_URL,
  };
}
