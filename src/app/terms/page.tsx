import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for the free hosted instance of Rent Tool at renttools.io.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[#e8e8ec] hover:text-white">
            ← Rent Tool
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#a0a0a8]">
            <Link href="/privacy" className="hover:text-[#e8e8ec]">Privacy</Link>
            <Link href="/login" className="hover:text-[#e8e8ec]">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#71717a]">Last updated: 2026-05-04</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#d4d4d8] sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">1. About this service</h2>
            <p>
              Rent Tool is an open-source property and reservation manager. You can self-host the
              source code under the MIT license, or use the free hosted instance operated by the
              maintainer at <span className="font-mono text-[#e8e8ec]">renttools.io</span>.
              These terms apply only to the hosted instance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">2. Free service, no warranty</h2>
            <p>
              The hosted instance is provided free of charge and &quot;as is&quot;, without
              warranty of any kind, express or implied, including but not limited to warranties
              of merchantability, fitness for a particular purpose, and non-infringement. Use it
              at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">3. No liability</h2>
            <p>
              The maintainer is not liable for any direct, indirect, incidental, consequential,
              or punitive damages arising out of your use of, or inability to use, the service —
              including but not limited to lost reservations, missed cleanings, calendar
              desync, or guest-data loss. If the service is critical to your business, please
              self-host so you control your own backups, uptime, and data residency.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">4. You own your data</h2>
            <p>
              All properties, reservations, guest records, and templates you create remain
              yours. You can export them at any time as CSV from the Reports panel. You can
              delete your account from the Profile panel; deletion removes all associated data
              from the production database within 7 days.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">5. Acceptable use</h2>
            <p>
              Don&apos;t use the service to break the law, abuse other users, hammer the API
              beyond the documented rate limits, or hold guest data for parties who have not
              consented. The maintainer reserves the right to suspend or delete accounts that
              violate these rules, abuse the free tier, or threaten the stability of the
              hosted instance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">6. Service availability</h2>
            <p>
              The hosted instance has no SLA. The maintainer aims for best-effort uptime but
              may take it offline for maintenance, migration, or — in extreme cases — to shut
              the service down entirely. If shutdown is planned, registered users will be
              notified by email at least 30 days in advance with instructions to export their
              data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">7. Changes to these terms</h2>
            <p>
              These terms may change. Material changes will be announced inside the app or by
              email. Continued use of the service after a change means you accept the updated
              terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">8. Governing law</h2>
            <p>
              These terms are governed by the laws of the maintainer&apos;s country of
              residence. Disputes that cannot be resolved informally should be raised on the
              GitHub issue tracker first.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">9. Contact</h2>
            <p>
              File an issue at{" "}
              <a
                href="https://github.com/Gribadan/rent-tool/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                github.com/Gribadan/rent-tool/issues
              </a>{" "}
              or open the Profile panel to use the contact link.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 Rent Tool · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/privacy" className="hover:text-[#e8e8ec]">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
