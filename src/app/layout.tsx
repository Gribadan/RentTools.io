import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { FeedbackButton } from "@/components/feedback-button";
import { JsonLd } from "@/components/json-ld";
import { getLocale } from "@/lib/i18n/server";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";
const SITE_NAME = "RentTools";
const SITE_TAGLINE =
  "Free open-source property manager for short-term rental hosts. Sync Airbnb + Booking.com calendars, automate cleaning, extract guest passports.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — open-source property manager for short-term rentals`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — open-source property manager`,
    description: SITE_TAGLINE,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — open-source property manager`,
    description: SITE_TAGLINE,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Inline boot script — runs before React hydrates so we never flash the
// wrong theme. Reads the rt-theme cookie + localStorage; light by default
// when neither signal exists. Kept tiny so it doesn't delay first paint.
const themeBoot = `(function(){try{var c=document.cookie.match(/(?:^|; )rt-theme=([^;]+)/);var t=(c&&c[1])||localStorage.getItem("rt-theme")||"light";if(t==="dark"){document.documentElement.classList.add("dark")}document.documentElement.style.colorScheme=t}catch(e){}})()`;

// Site-identity JSON-LD. Lives in the root layout so every page emits it,
// which lets Google merge brand signals (sameAs, logo, founder) into a
// Knowledge Graph entity rather than treating each page as an island.
// Distinct from per-page Article / SoftwareApplication / FAQPage blocks —
// those describe the *page*, this describes the *publisher*.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icon.svg`,
    width: 512,
    height: 512,
  },
  sameAs: ["https://github.com/Gribadan/RentTools.io"],
  founder: { "@type": "Person", name: "Ilya Asminkin" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@renttools.io",
    availableLanguage: ["en", "ru"],
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_TAGLINE,
  inLanguage: ["en", "ru"],
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the cookie server-side so the initial paint matches what the boot
  // script will set. Cookie is preferred over localStorage because the
  // server can read it; localStorage is the toggle's fallback.
  const cookieStore = await cookies();
  const initialTheme = cookieStore.get("rt-theme")?.value === "dark" ? "dark" : "light";
  // <html lang="…"> must reflect the URL-resolved locale, NOT a cookie.
  // Googlebot has no rt-locale cookie, so a cookie-based read serves
  // /ru/ pages with `lang="en"` to crawlers — Google would then rank
  // the RU page lower in russophone markets because the language signal
  // disagrees with the body. getLocale() reads the x-locale header set
  // by middleware, which mirrors the URL prefix, so the lang attribute
  // and the body language always agree.
  const lang = await getLocale();
  // Lift the session into the client provider so chrome that lives in
  // client components (MarketingHeader, etc.) can show the right state
  // without an extra fetch. getSession() already runs on every page that
  // gates content; re-running it in the root layout is the same DB hit
  // because Prisma's request-scoped cache reuses the result.
  const session = await getSession();
  const clientSession = session
    ? { userId: session.userId, username: session.username, role: session.role }
    : null;
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased ${initialTheme === "dark" ? "dark" : ""}`}
      style={{ colorScheme: initialTheme }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <JsonLd data={ORGANIZATION_JSON_LD} />
        <JsonLd data={WEBSITE_JSON_LD} />
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sans)]">
        <Providers initialLocale={lang} initialSession={clientSession}>{children}</Providers>
        {/* Floating feedback pill — site-wide on public pages. The
            component itself opts out on /dashboard, /admin, /g/, /invite/
            via usePathname so signed-in app surfaces stay uncluttered. */}
        <FeedbackButton />
      </body>
    </html>
  );
}
