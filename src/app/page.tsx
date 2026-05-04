import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const REPO_URL = "https://github.com/Gribadan/rent-tool";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e1e22]">
              <svg className="h-4 w-4 text-[#e8e8ec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
              </svg>
            </div>
            <span className="text-base font-semibold">Rent Tool</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
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
            <Link
              href="/signup"
              className="rounded-md bg-[#ff385c] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
            >
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[#ff385c]">
              Open source · Free hosted version
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Rent Tool
            </h1>
            <p className="mt-4 text-xl text-[#a0a0a8] sm:text-2xl">
              Self-host your Airbnb + Booking.com calendar, cleaning schedule, and guest documents — or use it free here.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#ff385c] px-6 text-sm font-medium text-white transition-colors hover:bg-[#e0294d] sm:w-auto"
              >
                Sign up free
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#333338] bg-[#18181b] px-6 text-sm font-medium text-[#e8e8ec] transition-colors hover:bg-[#1e1e22] sm:w-auto"
              >
                View source on GitHub
              </a>
            </div>
            <p className="mt-6 text-xs text-[#71717a]">
              No credit card. Self-host in 5 minutes if you'd rather run your own.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
            <FeatureCard
              title="Calendar sync"
              body="Pull Airbnb and Booking.com via iCal. Add manual bookings alongside synced ones with conflicts highlighted. Per-property buffer days."
            />
            <FeatureCard
              title="Cleaning automation"
              body="Daily / weekly cleaning schedule generated from check-out → check-in dates. Mark done, skipped, print today's list. Cleaner role with restricted view."
            />
            <FeatureCard
              title="Guest documents"
              body="Drop a passport photo, get the fields back. Per-property message templates with variables. Cmd-K guest search across every property you own."
            />
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-center text-2xl font-semibold sm:text-3xl">
              See it in action
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <ScreenshotCard caption="Calendar with synced + manual bookings" />
              <ScreenshotCard caption="Cleaning schedule" />
              <ScreenshotCard caption="Guest cards" />
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-2xl rounded-lg border border-[#1e2329] bg-[#0f1419] p-6 sm:p-8">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Built by a real owner
            </h2>
            <p className="mt-3 text-sm text-[#a0a0a8] sm:text-base">
              Built by a real owner of 2 properties tired of juggling 4 calendar tabs. Used in production daily; the issues that matter get fixed first.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Two ways to use it
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#1e2329] bg-[#0f1419] p-6 text-left">
                <h3 className="text-base font-semibold">Free hosted version</h3>
                <p className="mt-2 text-sm text-[#a0a0a8]">
                  Sign up here. The same code, hosted by the maintainer, free for personal use. Rate-limited per account.
                </p>
                <Link
                  href="/signup"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-[#ff385c] px-4 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
                >
                  Sign up
                </Link>
              </div>
              <div className="rounded-lg border border-[#1e2329] bg-[#0f1419] p-6 text-left">
                <h3 className="text-base font-semibold">Self-host</h3>
                <p className="mt-2 text-sm text-[#a0a0a8]">
                  Clone the repo, point to a SQLite file, and run on a $6 droplet. MIT licensed.
                </p>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-[#333338] bg-[#18181b] px-4 text-sm font-medium text-[#e8e8ec] transition-colors hover:bg-[#1e1e22]"
                >
                  Read the docs
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 Rent Tool · MIT License</p>
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
            <Link href="/login" className="hover:text-[#e8e8ec]">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[#1e2329] bg-[#0f1419] p-6">
      <h3 className="text-base font-semibold text-[#e8e8ec]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">{body}</p>
    </div>
  );
}

function ScreenshotCard({ caption }: { caption: string }) {
  // Screenshots land in /public/docs/screenshots/ later; for now show a placeholder
  // so the layout is final and the maintainer can drop files in without code changes.
  return (
    <figure className="overflow-hidden rounded-lg border border-[#1e2329] bg-[#0f1419]">
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#111113] to-[#1a1d24] text-xs text-[#71717a]">
        Screenshot
      </div>
      <figcaption className="border-t border-[#1e2329] px-4 py-3 text-xs text-[#a0a0a8]">
        {caption}
      </figcaption>
    </figure>
  );
}
