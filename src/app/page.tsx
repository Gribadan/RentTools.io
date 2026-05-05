import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/site-settings";
import { applySeoOverrides } from "@/lib/seo";
import { GoogleOneTap } from "@/components/google-one-tap";
import { JsonLd } from "@/components/json-ld";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

// Per-path SEO override hook (RT-18.3). The root layout already supplies
// title / description / OG / canonical defaults; this lets a super-admin
// swap any of those for "/" specifically without redeploying.
export async function generateMetadata(): Promise<Metadata> {
  return applySeoOverrides<Metadata>({}, "/", "en");
}

const REPO_URL = "https://github.com/Gribadan/RentTools.io";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Does this actually prevent double-bookings?",
    a: "It cuts the risk dramatically — not to zero, but close. We pull each platform's iCal feed every 10 minutes and republish it for the others, so Airbnb learns about Booking.com bookings (and vice versa) within ~10 min on our side. The platforms refresh imported feeds every 2-12h on their side. Real-time API sync would be faster, but Airbnb / Booking.com don't sell their channel-manager APIs to individual hosts — only to certified PMS providers who charge $100-300/mo to forward the same feeds we sync for free. For 99% of small hosts, the iCal handshake is more than enough.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The hosted instance is free for personal use, rate-limited per account so the bills stay sane. The source is MIT — clone it, run it on a $4 droplet, you owe nothing.",
  },
  {
    q: "What does it actually do?",
    a: "Pulls any iCal-compatible calendar — Airbnb, Booking.com, Vrbo, or anything else that exposes an export URL — so you stop juggling tabs. Adds buffer days for cleaning that the platforms can't do natively. Generates a daily cleaning list. Per-property message templates and Cmd-K guest search across every property you own.",
  },
  {
    q: "Do I have to host my own?",
    a: "No. Sign up here and use the hosted version. If one day you outgrow the free tier or want full data ownership, export and self-host — your data, your call.",
  },
  {
    q: "Where does my guest data live?",
    a: "On a single SQLite file inside the hosted server. No third-party processors except Google Gemini for passport OCR (and only for that one request). Delete your account and the data is gone.",
  },
];

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const supportEmail = (await getSetting("support_email", "")).trim();

  return (
    <div className="editorial min-h-screen flex flex-col">
      <JsonLd data={FAQ_LD} />
      <GoogleOneTap />

      {/* ─────────────── Header ─────────────── */}
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink)] text-[var(--bg)] transition-transform group-hover:rotate-6">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
              </svg>
            </div>
            <span className="display text-[17px] font-semibold tracking-tight text-[var(--ink)]">RentTools</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href={`${REPO_URL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors sm:inline-flex"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
              </svg>
              GitHub
            </a>
            <Link href="/login" className="rounded-md px-3 py-1.5 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors">
              Sign in
            </Link>
            <Link
              href="/onboard"
              className="hidden rounded-md bg-[var(--ink)] px-3 py-1.5 text-[13px] font-medium text-[var(--bg)] hover:bg-[var(--ink-2)] transition-colors sm:inline-flex"
            >
              Get started
            </Link>
            <span className="mx-1 h-4 w-px bg-[var(--line)]" />
            <ThemeToggle />
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* ─────────────── Hero ─────────────── */}
      <section className="relative overflow-hidden">
        {/* Calendar-grid background with subtle "booking pill" hints. The grid
            cells are wider than tall (80×64) so it reads like an Airbnb /
            Booking month view instead of generic graph paper. */}
        <div className="grid-bg absolute inset-0 pointer-events-none opacity-60" aria-hidden="true" />
        <div className="calendar-pills absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1180px] px-6 pt-16 pb-16 text-center sm:pt-20 sm:pb-20">
          <p className="hero-in mono mb-5 inline-block rounded-full bg-[var(--bg-2)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            Open source · Forever free
          </p>
          <h1 className="hero-in hero-in-2 display mx-auto max-w-[820px] text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink)] sm:text-[52px] lg:text-[60px]">
            Stop juggling{" "}
            <span className="relative whitespace-nowrap">
              <span className="italic font-normal">calendar tabs</span>
              <svg
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5"
                width="100%"
                height="10"
                viewBox="0 0 220 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="underline-draw"
                  d="M2 6 Q 55 1, 110 5 T 218 5"
                  fill="none"
                  stroke="var(--m-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>
          <p className="hero-in hero-in-3 mx-auto mt-6 max-w-[620px] text-[16px] leading-[1.55] text-[var(--ink-2)] sm:text-[18px]">
            Cross-sync calendars across{" "}
            <span className="text-[var(--ink)] font-medium">Airbnb, Booking.com, Vrbo</span>{" "}
            and any iCal source so each platform sees the others&apos; bookings —{" "}
            <span className="text-[var(--ink)] font-medium">drastically fewer double-booking surprises</span>. Forever free, open-source.
          </p>

          <div className="hero-in hero-in-4 mt-8 flex justify-center">
            <Link
              href="/onboard"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--m-accent)] px-8 text-[14px] font-medium text-white transition-all hover:bg-[var(--m-accent-2)] hover:translate-y-[-1px] active:translate-y-0 shadow-[0_2px_8px_rgba(255,56,92,0.25)] sm:w-auto"
            >
              Start now — forever free
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <p className="hero-in hero-in-4 mt-4 text-[12.5px] text-[var(--ink-3)]">
            No credit card. No paid tier. Try the wizard before signing up.
          </p>
        </div>
      </section>

      {/* ─────────────── How it works ─────────────── */}
      <section id="how-it-works" className="border-t border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">How it works</p>
            <h2 className="display-tight mt-3 text-[32px] font-semibold tracking-tight text-[var(--ink)] sm:text-[42px]">
              Three steps. Most hosts finish in seven minutes.
            </h2>
          </div>
          <ol className="mt-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
            <Step
              n="01"
              title="Paste your platform iCal URLs"
              body="Airbnb has one in Calendar → Sync calendars → Export. Booking.com has one in Calendar → Sync calendars. Vrbo too. Drop them in our wizard."
            />
            <Step
              n="02"
              title="We hand you back a unified feed"
              body="One iCal URL per platform that includes everyone else's bookings plus your manual entries plus cleaning buffer days. No double bookings."
            />
            <Step
              n="03"
              title="Paste our URL back into each platform"
              body="Airbnb and Booking.com pull our feed every few hours. Now their calendars know about each other and about your manual blocks."
            />
          </ol>
          <div className="mt-12 text-center">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--m-accent)] hover:underline"
            >
              Try the wizard without signing up
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────── Features ─────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">Built for the parts that hurt</p>
            <h2 className="display-tight mt-3 text-[32px] font-semibold tracking-tight text-[var(--ink)] sm:text-[42px]">
              Everything a host needs.<br className="hidden sm:inline" /> Nothing you&apos;ll never use.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="Cross-platform calendar sync"
              body="Every 10 minutes we pull each platform's iCal feed and republish it for the others. Airbnb sees Booking's bookings and vice versa — the same protection paid channel managers offer, just free and open-source."
            />
            <Feature
              title="Cleaning automation"
              body="Buffer days the platforms can't do natively. Daily cleaning list. Cleaner role with restricted dashboard access."
            />
            <Feature
              title="Multi-property dashboard"
              body="Run as many places as you want from one panel. Switch context with a keystroke. Property managers + cleaners get scoped roles."
            />
            <Feature
              title="Message templates"
              body="Per-property templates with variables (guest name, check-in, wifi). Copy to clipboard, paste into Airbnb / WhatsApp."
            />
            <Feature
              title="Public iCal feed"
              body="Every property has its own feed URL. Paste it back into Airbnb / Booking and let them pull your manual blocks."
            />
            <Feature
              title="Cmd-K guest search"
              body="Find any past guest across every property in one keystroke. With document export when you need to file paperwork."
            />
          </div>
        </div>
      </section>

      {/* ─────────────── Compatible with strip ─────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1180px] px-6 py-12 sm:py-16">
          <p className="mono text-center text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            Compatible with
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
            {[
              { name: "Airbnb", color: "#ff385c" },
              { name: "Booking.com", color: "#003580" },
              { name: "Vrbo", color: "#245abc" },
              { name: "Expedia", color: "#c69a14" },
              { name: "Hostaway", color: "#2e5bff" },
              { name: "Lodgify", color: "#00928a" },
              { name: "Smoobu", color: "#5b1a98" },
              { name: "Plum Guide", color: "#2e1065" },
            ].map((p) => (
              <PlatformChip key={p.name} name={p.name} color={p.color} />
            ))}
          </div>
          <p className="mt-6 text-center text-[12.5px] text-[var(--ink-3)]">
            …and any platform that exports an iCal feed.
          </p>
        </div>
      </section>

      {/* ─────────────── Trust ─────────────── */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
            <Trust
              title="Open source"
              body="MIT-licensed on GitHub. Read the code, file an issue, or self-host on any $4 droplet."
              link={{ href: REPO_URL, label: "View on GitHub", external: true }}
            />
            <Trust
              title="GDPR compliant"
              body="One essential session cookie. No analytics, no ads, no third-party trackers. Delete your account, your data is gone."
              link={{ href: "/privacy", label: "Privacy policy" }}
            />
          </div>
        </div>
      </section>

      {/* ─────────────── FAQ ─────────────── */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[760px] px-6 py-20 sm:py-24">
          <div className="text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">Quick answers</p>
            <h2 className="display-tight mt-3 text-[32px] font-semibold tracking-tight text-[var(--ink)] sm:text-[40px]">
              The questions hosts ask first.
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {FAQS.map((f) => (
              <Faq key={f.q} q={f.q}>
                {f.a}
              </Faq>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── Final CTA ─────────────── */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-[680px] text-center">
            <h2 className="display text-[36px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[52px]">
              Built by a host. <span className="italic font-normal">For hosts.</span>
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-[var(--ink-2)]">
              No paid tier. No upsell. No tracking. The maintainer pays the hosting bill so you can focus on guests instead of calendar tabs.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/onboard"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--m-accent)] px-7 text-[14px] font-medium text-white transition-all hover:bg-[var(--m-accent-2)] hover:translate-y-[-1px] active:translate-y-0 shadow-[0_2px_8px_rgba(255,56,92,0.25)] sm:w-auto"
              >
                Start now — forever free
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-6 text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)] sm:w-auto"
              >
                Read the source
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Footer ─────────────── */}
      <footer className="mt-auto border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1180px] px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 text-[12.5px] text-[var(--ink-3)] sm:flex-row">
            <p>© 2026 RentTools · MIT License</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)] transition-colors">GitHub</a>
              <Link href="/blog" className="hover:text-[var(--ink)] transition-colors">Blog</Link>
              <Link href="/terms" className="hover:text-[var(--ink)] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">Privacy</Link>
              {supportEmail && (
                <a href={`mailto:${supportEmail}`} className="hover:text-[var(--ink)] transition-colors">
                  {supportEmail}
                </a>
              )}
              <Link href="/login" className="hover:text-[var(--ink)] transition-colors">Sign in</Link>
            </nav>
          </div>
          <p className="mt-3 text-center text-[11px] text-[var(--ink-4)] sm:text-left">
            Essential cookies only — no tracking, no analytics. See <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--ink-3)]">Privacy</Link>.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="relative rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6 transition-colors hover:border-[var(--line-2)]">
      <span className="mono absolute -top-3 left-6 inline-block rounded-md bg-[var(--ink)] px-2 py-0.5 text-[11px] font-medium text-[var(--bg)]">
        {n}
      </span>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{body}</p>
    </li>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6 transition-all hover:border-[var(--line-2)] hover:translate-y-[-2px]">
      <h3 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-2)]">{body}</p>
    </div>
  );
}

function Trust({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link?: { href: string; label: string; external?: boolean };
}) {
  return (
    <div>
      <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-2)]">{body}</p>
      {link && (
        link.external ? (
          <a href={link.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--m-accent)] hover:underline">
            {link.label}
            <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : (
          <Link href={link.href} className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--m-accent)] hover:underline">
            {link.label}
            <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )
      )}
    </div>
  );
}

function PlatformChip({ name, color }: { name: string; color: string }) {
  // Brand-tinted pill — colour at low opacity for the bg, full colour for
  // text. No actual brand logos used so we sidestep brand-asset licensing;
  // the wordmark + brand colour is enough recognition for a trust strip.
  return (
    <span
      className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors"
      style={{
        color,
        borderColor: `${color}33`, // 20% alpha border
        backgroundColor: `${color}0d`, // ~5% alpha fill
      }}
    >
      {name}
    </span>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-[var(--line)] bg-[var(--bg)] open:border-[var(--line-2)] transition-colors">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-medium text-[var(--ink)] [&::-webkit-details-marker]:hidden">
        {q}
        <svg className="h-4 w-4 text-[var(--ink-3)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="border-t border-[var(--line)] px-5 py-4 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
        {children}
      </div>
    </details>
  );
}
