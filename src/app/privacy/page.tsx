import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data Rent Tool collects, where it lives, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[#e8e8ec] hover:text-white">
            ← Rent Tool
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#a0a0a8]">
            <Link href="/terms" className="hover:text-[#e8e8ec]">Terms</Link>
            <Link href="/login" className="hover:text-[#e8e8ec]">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#71717a]">Last updated: 2026-05-04</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#d4d4d8] sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Scope</h2>
            <p>
              This policy covers the free hosted instance at{" "}
              <span className="font-mono text-[#e8e8ec]">renttools.io</span>. If you
              self-host the open-source code, you control your own data — this policy does
              not apply.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">What data we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[#e8e8ec]">Account:</span> the username and
                hashed password you provide at signup. We do not require an email at signup.
                Passwords are hashed with bcrypt and never stored in cleartext.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Properties &amp; reservations:</span>{" "}
                everything you create or import — names, dates, platforms, notes. iCal feeds
                you connect (Airbnb, Booking.com) are pulled every 10 minutes.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Guest records:</span> if you
                upload a passport photo for extraction, the photo is sent to Google Gemini
                Vision for OCR and the extracted fields are stored in your account.
                Photos themselves are not retained after extraction completes.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Operational logs:</span> request
                logs (path, status, duration, IP, user ID) are kept for up to 30 days to
                debug issues. Sync logs are retained per property to power the alerts banner.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Audit log:</span> a record of
                mutations on your own resources (create / update / delete) is retained so
                you can review your own activity from the Profile panel.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Where data lives</h2>
            <p>
              Production data is stored in a SQLite database on a DigitalOcean droplet
              operated by the maintainer. Daily backups are kept on the same machine for 14
              days, weekly for 8 weeks, monthly for 6 months. During the migration off the
              previous Vercel + Turso stack, some logs may briefly co-exist on both
              providers; this transitional state ends once the cutover is complete.
            </p>
            <p className="mt-2">
              Passport photos are sent to Google Gemini for OCR. Google&apos;s data handling
              for the Gemini API is governed by{" "}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                Google&apos;s API terms
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Cookies</h2>
            <p>
              We set one HTTP-only session cookie (<span className="font-mono">rent-tool-session</span>),
              a 7-day JWT, used solely for authentication. We do not use third-party
              analytics, advertising, or tracking cookies on the hosted instance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Sharing</h2>
            <p>
              We do not sell or rent your data. We share data only with the infrastructure
              providers that host the service (the droplet provider and Google Gemini, as
              listed above), and only to the extent necessary to operate the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Your rights (GDPR)</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[#e8e8ec]">Access &amp; export:</span> the
                Reports panel exports your reservations as CSV. The Profile &gt; Audit Log
                section shows your activity history. A full account export is available from
                the Profile panel.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Deletion:</span> you can delete
                your account from the Profile panel. All your properties, reservations,
                guests, calendar links, audit entries and message templates are removed
                from the production database within 7 days. Backups containing the deleted
                data age out within 6 months.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Rectification:</span> all
                fields are user-editable through the app.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Guest passport data — your responsibility</h2>
            <p>
              When you store a guest&apos;s passport details, you are the data controller
              under GDPR for that information. Make sure you have a lawful basis to collect
              and retain it, and respect your guests&apos; rights to access, rectify, and
              delete. Rent Tool is the data processor and will act on instructions from
              you (the controller) — including erasure.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Children</h2>
            <p>
              The service is intended for property owners and is not directed at children.
              Don&apos;t create accounts on behalf of minors.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">Contact</h2>
            <p>
              Questions or data-rights requests:{" "}
              <a
                href="https://github.com/Gribadan/rent-tool/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                github.com/Gribadan/rent-tool/issues
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 Rent Tool · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/terms" className="hover:text-[#e8e8ec]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
