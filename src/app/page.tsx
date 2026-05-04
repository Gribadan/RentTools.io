import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/site-settings";
import { GoogleOneTap } from "@/components/google-one-tap";

const REPO_URL = "https://github.com/Gribadan/RentTools.io";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const supportEmail = (await getSetting("support_email", "")).trim();

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <GoogleOneTap />
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e1e22]">
              <svg className="h-4 w-4 text-[#e8e8ec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
              </svg>
            </div>
            <span className="text-base font-semibold">RentTools</span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-5">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm text-[#a0a0a8] hover:text-[#e8e8ec] sm:inline"
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="text-sm text-[#a0a0a8] hover:text-[#e8e8ec]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Forever free.
            </h1>
            <p className="mt-4 text-lg text-[#a0a0a8] sm:mt-5 sm:text-xl">
              Free to use. Free to leave. Free to self-host.
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>
              Calendar sync, cleaning automation, and guest documents for short-term rental hosts.
            </p>
            <div className="mt-7 flex justify-center sm:mt-9">
              <Link
                href="/onboard"
                className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-md bg-[#ff385c] px-8 text-base font-medium text-white transition-colors hover:bg-[#e0294d]"
              >
                Start now
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#71717a]">
              No credit card. Account in 30 seconds.
            </p>
          </div>
        </section>

        <section className="border-t border-[#1e2329] px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3 sm:gap-8">
            <TrustSignal
              title="Open source"
              body="MIT-licensed. Read the code, file an issue, or self-host on any $4 droplet."
              link={{ href: REPO_URL, label: "View on GitHub", external: true }}
            />
            <TrustSignal
              title="GDPR-compliant"
              body="One essential session cookie. No analytics, no ads, no third-party trackers."
              link={{ href: "/privacy", label: "Privacy policy" }}
            />
            <TrustSignal
              title="Run on real properties"
              body="Two short-term rentals run on this code daily. The maintainer is the first user."
            />
          </div>
        </section>

        <section className="border-t border-[#1e2329] px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-semibold sm:text-3xl">
              Quick answers
            </h2>
            <div className="mt-8 space-y-3">
              <Faq q="Is it really free?">
                Yes. The hosted instance is free for personal use, rate-limited per
                account so the bills stay sane. The source is MIT — clone it, run it
                on a $4 droplet, you owe nothing.
              </Faq>
              <Faq q="What does it actually do?">
                Pulls any iCal-compatible calendar — Airbnb, Booking.com, Vrbo, or
                anything else that exposes an export URL — so you stop juggling
                tabs. Adds buffer days for cleaning that the platforms can&apos;t do
                natively. Generates a daily cleaning list. Extracts passport fields
                from a photo so you spend less time typing.
              </Faq>
              <Faq q="Do I have to host my own?">
                No. Sign up here and use the hosted version. If one day you outgrow
                the free tier or want full data ownership, export and self-host —
                your data, your call.
              </Faq>
              <Faq q="Where does my guest data live?">
                On a single SQLite file inside the hosted server. No third-party
                processors except Google Gemini for passport OCR (and only for that
                one request). Delete your account and the data is gone.
              </Faq>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#e8e8ec]">
              GitHub
            </a>
            <Link href="/terms" className="hover:text-[#e8e8ec]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#e8e8ec]">
              Privacy
            </Link>
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="hover:text-[#e8e8ec]">
                Need help? {supportEmail}
              </a>
            )}
            <Link href="/login" className="hover:text-[#e8e8ec]">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function TrustSignal({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link?: { href: string; label: string; external?: boolean };
}) {
  return (
    <div className="text-center sm:text-left">
      <h3 className="text-sm font-semibold text-[#e8e8ec]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">{body}</p>
      {link && (
        link.external ? (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-[#ff385c] hover:text-[#ffabb8]"
          >
            {link.label} →
          </a>
        ) : (
          <Link
            href={link.href}
            className="mt-2 inline-block text-xs text-[#ff385c] hover:text-[#ffabb8]"
          >
            {link.label} →
          </Link>
        )
      )}
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-[#1e2329] bg-[#0f1419] open:border-[#2a313b]">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-[#e8e8ec] [&::-webkit-details-marker]:hidden">
        {q}
        <svg className="h-4 w-4 text-[#71717a] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="border-t border-[#1e2329] px-4 py-3 text-sm leading-relaxed text-[#a0a0a8]">
        {children}
      </div>
    </details>
  );
}
