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
    rules: {
      userAgent: "*",
      // Authenticated app surfaces — no SEO value, and they redirect to
      // /login for unauth visitors so a crawler hits a sign-in wall.
      disallow: ["/api/", "/dashboard", "/admin", "/invite/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
