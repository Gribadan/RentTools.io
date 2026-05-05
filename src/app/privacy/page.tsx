import type { Metadata } from "next";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";

const PRIVACY_TITLE = "Privacy Policy";
const PRIVACY_DESCRIPTION =
  "How RentTools collects, uses, stores, and protects your data — and how to access, export, or delete it.";

export const metadata: Metadata = {
  title: PRIVACY_TITLE,
  description: PRIVACY_DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "article",
    title: `${PRIVACY_TITLE} · RentTools`,
    description: PRIVACY_DESCRIPTION,
    url: "/privacy",
    siteName: "RentTools",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRIVACY_TITLE} · RentTools`,
    description: PRIVACY_DESCRIPTION,
  },
};

const LAST_UPDATED = "2026-05-05";
const OPERATOR_NAME = "Ilya Asminkin";
const OPERATOR_EMAIL = "ilya.asminkin@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[#e8e8ec] hover:text-white">
            ← RentTools
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#a0a0a8]">
            <Link href="/terms" className="hover:text-[#e8e8ec]">Terms</Link>
            <Link href="/login" className="hover:text-[#e8e8ec]">Sign in</Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#71717a]">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#d4d4d8] sm:text-base">
          <section>
            <p>
              This Privacy Policy describes how RentTools (&quot;the Service&quot;,
              &quot;we&quot;, &quot;our&quot;), operated by {OPERATOR_NAME} as an
              independent maintainer, collects, uses, stores, and protects information when
              you use the hosted instance at{" "}
              <span className="font-mono text-[#e8e8ec]">https://renttools.io</span>.
              By using the Service you agree to the practices described below. If you
              self-host the open-source code on your own infrastructure, you act as the
              data controller for that instance and this policy does not apply to you.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">1. Who we are</h2>
            <p>
              The Service is operated by {OPERATOR_NAME} as a free, non-commercial side
              project. There is no parent company. The contact address for any privacy
              question, data request, or complaint is:
            </p>
            <p className="mt-2 font-mono text-[#e8e8ec]">{OPERATOR_EMAIL}</p>
            <p className="mt-2">
              Under the EU General Data Protection Regulation (GDPR) and the UK GDPR,{" "}
              {OPERATOR_NAME} is the data controller for the personal data described in
              section 2(a)–(c) below. For guest passport data you upload (section 2(d)),
              you are the controller and we act as your processor.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">2. What data we collect</h2>
            <p>We collect only the minimum necessary to operate the Service.</p>
            <p className="mt-3 font-medium text-[#e8e8ec]">(a) Account data</p>
            <p>
              Username and password (stored as a bcrypt hash; the plain-text password is
              never written to disk or logs). Account creation timestamp, last login
              timestamp, role (owner / cleaner / admin), and — if you choose to provide
              one — an optional support email address. We do not require an email at
              signup.
            </p>
            <p className="mt-3 font-medium text-[#e8e8ec]">(b) Service data you create</p>
            <p>
              Properties, reservations, calendar links, message templates, cleaning
              records, and any notes or tags you add. iCal feed URLs you connect to
              external platforms (Airbnb, Booking.com) and the events those feeds return.
            </p>
            <p className="mt-3 font-medium text-[#e8e8ec]">(c) Operational data</p>
            <p>
              Server-side request logs containing path, HTTP status, response time, IP
              address, and authenticated user ID. Application error reports captured by
              Sentry (see section 4). Calendar sync logs per property. Audit logs of
              create/update/delete actions on your own resources. Operational data is
              retained for up to 30 days to debug incidents and detect abuse.
            </p>
            <p className="mt-3 font-medium text-[#e8e8ec]">(d) Guest passport data (you upload)</p>
            <p>
              When you upload a passport photo for OCR, the image is transmitted to Google
              Gemini for one-time field extraction (full name, date of birth, document
              number, country, document type, expiry date). The extracted fields are
              attached to the relevant reservation in your account. The original photo is
              not retained on our servers after extraction completes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">3. How we use your data and the legal basis</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[#e8e8ec]">Performance of contract</span>{" "}
                (Art. 6(1)(b) GDPR): authenticating you, storing your properties and
                bookings, syncing calendars, generating cleaning schedules, rendering
                message templates, exporting your data on request.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Legitimate interests</span>{" "}
                (Art. 6(1)(f) GDPR): keeping the Service secure, debugging errors,
                protecting against abuse and rate-limit violations, and operating
                infrastructure (logs, backups, monitoring). Where we rely on legitimate
                interests we balance them against your rights and ask only what we need.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Legal obligation</span>{" "}
                (Art. 6(1)(c) GDPR): retaining data as required to respond to lawful
                requests from authorities.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">For guest passports you upload</span>:
                we are your processor and act on your documented instructions only. You
                are responsible for having an appropriate lawful basis (your local
                hospitality registration law, consent, etc.).
              </li>
            </ul>
            <p className="mt-3">
              We do not use your data for advertising, profiling, automated decisions
              with legal effect, or training third-party machine-learning models.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">4. Sub-processors and third parties</h2>
            <p>We use a small set of infrastructure providers to run the Service:</p>
            <ul className="list-disc space-y-2 pl-5 mt-2">
              <li>
                <span className="font-medium text-[#e8e8ec]">DigitalOcean, LLC</span> —
                hosts the application server and the SQLite database (EU region). Acts
                as a hosting sub-processor.{" "}
                <a href="https://www.digitalocean.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                  Privacy policy
                </a>.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Cloudflare, Inc.</span> —
                DNS, CDN, and TLS proxy. Sees IP addresses and request metadata but
                does not see decrypted application content beyond what is needed to
                forward traffic.{" "}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                  Privacy policy
                </a>.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Google LLC (Gemini API)</span> —
                processes uploaded passport images for one-time OCR. Subject to{" "}
                <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                  Google&apos;s Gemini API terms
                </a>{" "}
                and Google&apos;s privacy policy.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Functional Software, Inc. (Sentry)</span> —
                receives application error reports including stack traces, the requesting
                IP, and the authenticated user ID for debugging. Personally identifiable
                request bodies are scrubbed.{" "}
                <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                  Privacy policy
                </a>.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Better Stack s.r.o. (BetterStack)</span> —
                external uptime monitoring; pings the public health endpoint only. Does
                not see user data.{" "}
                <a href="https://betterstack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                  Privacy policy
                </a>.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Airbnb &amp; Booking.com</span>{" "}
                — third parties whose iCal export URLs you choose to provide. We only pull
                data from the URLs you give us; we do not push anything back to them.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or transfer personal data to any other party. We
              disclose data to authorities only when compelled by valid legal process.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">5. International data transfers</h2>
            <p>
              The application server is in the European Union. Sentry, Google Gemini,
              Cloudflare, and DigitalOcean&apos;s control plane involve data transfers to
              the United States. Where personal data is transferred outside the EEA / UK,
              we rely on the European Commission&apos;s Standard Contractual Clauses
              and the Data Privacy Framework adequacy decisions (where applicable) as the
              transfer mechanism, and on the providers&apos; contractual commitments to
              equivalent protection.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">6. Where data lives and how long we keep it</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Account, service, and audit data: kept for as long as your account is
                active, then deleted within 7 days of account-deletion request.
              </li>
              <li>
                Encrypted SQLite backups: 14 daily, 8 weekly, 6 monthly snapshots, then
                purged. Backups containing data of a deleted account age out of all
                tiers within ~6 months of deletion.
              </li>
              <li>
                Operational logs (request, sync, error): up to 30 days.
              </li>
              <li>
                Sentry error events: 90 days (Sentry&apos;s default for free tier).
              </li>
              <li>
                Uploaded passport images: not retained — discarded immediately after
                Gemini extraction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">7. Cookies</h2>
            <p>
              We set exactly one cookie: a {`HTTP-only, Secure, SameSite=Lax`} session
              cookie holding a 7-day JWT, used solely for authentication. We do not use
              third-party analytics, advertising, social-media, or tracking cookies. We
              do not need a cookie banner because we do not place non-essential cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">8. Your rights</h2>
            <p>
              Under GDPR (and similar laws in the UK, California, Brazil, etc.) you have
              the right to:
            </p>
            <ul className="list-disc space-y-2 pl-5 mt-2">
              <li>
                <span className="font-medium text-[#e8e8ec]">Access</span> the personal
                data we hold about you. Use Profile → Export my data for a JSON dump of
                your full account.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Rectify</span> inaccurate
                data — every field is editable in-app.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Erase</span> your data
                (&quot;right to be forgotten&quot;) — Profile → Danger zone → Delete my
                account. Removes everything tied to your account immediately, with
                backup ageing as described above.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Port</span> your data to
                another service — the Reports panel exports reservations as CSV, and the
                full export above is JSON.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Restrict</span> or
                <span className="font-medium text-[#e8e8ec]"> object</span> to processing
                we base on legitimate interests. Email{" "}
                <a href={`mailto:${OPERATOR_EMAIL}`} className="text-[#58a6ff] hover:underline">{OPERATOR_EMAIL}</a>{" "}
                with the subject &quot;GDPR request&quot; and we will respond within 30
                days.
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Withdraw consent</span>{" "}
                where consent is the legal basis (e.g. when you have asked us to email
                you about service changes — currently we don&apos;t).
              </li>
              <li>
                <span className="font-medium text-[#e8e8ec]">Lodge a complaint</span>{" "}
                with your national data-protection authority. EU users can find their
                local authority at{" "}
                <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                  edpb.europa.eu
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">9. Security</h2>
            <p>
              We protect your data with TLS 1.2+ in transit (Let&apos;s Encrypt
              certificates, Cloudflare Full-Strict mode end-to-end), bcrypt password
              hashing at rest, JWT-based session authentication with HTTP-only cookies,
              IP-based rate limiting on auth endpoints, automated daily backups,
              firewalled host access (ufw), brute-force protection (fail2ban), and
              automatic security updates (unattended-upgrades). No system is 100% secure;
              we will notify affected users without undue delay if we discover a breach
              that puts your data at risk.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">10. Guest passport data — your responsibility</h2>
            <p>
              When you upload guest passports to RentTools you remain the data controller
              under GDPR for that information. You must have your own lawful basis to
              collect and retain it (typically a hospitality registration obligation
              under your local law, sometimes consent), inform your guests, and respect
              their rights to access, rectify, and erase the data you hold about them. We
              act on your instructions only and will assist you in fulfilling guest data
              requests.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">11. Children</h2>
            <p>
              The Service is intended for property owners and is not directed at
              children. We do not knowingly collect personal data from anyone under 16.
              Don&apos;t create an account on behalf of a minor. If you believe we have
              data about a minor, contact us at{" "}
              <a href={`mailto:${OPERATOR_EMAIL}`} className="text-[#58a6ff] hover:underline">{OPERATOR_EMAIL}</a>{" "}
              and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">12. Automated decision-making</h2>
            <p>
              We do not make decisions about you with legal or similarly significant
              effect using automated processing. Rate limits and the optional account-
              suspension kill switch are operated manually by the maintainer.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">13. Changes to this policy</h2>
            <p>
              We may update this Policy when the Service changes or when laws change.
              Material updates will be flagged inside the app and dated at the top of
              this page. Continued use after changes go live means you accept the
              updated Policy. Past versions are available in the public Git history of
              the open-source repository.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">14. Contact</h2>
            <p>
              For any privacy question, data request, or complaint:
            </p>
            <p className="mt-2 font-mono text-[#e8e8ec]">{OPERATOR_EMAIL}</p>
            <p className="mt-2">
              You can also file a public issue at{" "}
              <a
                href="https://github.com/Gribadan/RentTools.io/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                github.com/Gribadan/RentTools.io/issues
              </a>
              {" "}— but please use email for anything that contains personal data.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/terms" className="hover:text-[#e8e8ec]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
