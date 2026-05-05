import type { Metadata } from "next";
import Link from "next/link";

const TERMS_TITLE = "Terms of Service";
const TERMS_DESCRIPTION = "Terms of service for the free hosted instance of RentTools at renttools.io.";

export const metadata: Metadata = {
  title: TERMS_TITLE,
  description: TERMS_DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: {
    type: "article",
    title: `${TERMS_TITLE} · RentTools`,
    description: TERMS_DESCRIPTION,
    url: "/terms",
    siteName: "RentTools",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TERMS_TITLE} · RentTools`,
    description: TERMS_DESCRIPTION,
  },
};

const LAST_UPDATED = "2026-05-05";
const OPERATOR_NAME = "Ilya Asminkin";
const OPERATOR_EMAIL = "ilya.asminkin@gmail.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[#e8e8ec] hover:text-white">
            ← RentTools
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#a0a0a8]">
            <Link href="/privacy" className="hover:text-[#e8e8ec]">Privacy</Link>
            <Link href="/login" className="hover:text-[#e8e8ec]">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#71717a]">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#d4d4d8] sm:text-base">
          <section>
            <p>
              These Terms of Service (&quot;Terms&quot;) form a binding agreement between
              you (&quot;you&quot;, &quot;your&quot;) and {OPERATOR_NAME}
              (&quot;we&quot;, &quot;us&quot;, &quot;the Operator&quot;), the
              independent maintainer of the RentTools service hosted at{" "}
              <span className="font-mono text-[#e8e8ec]">https://renttools.io</span>{" "}
              (&quot;the Service&quot;). By creating an account or using the Service you
              agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">1. About the Service</h2>
            <p>
              RentTools is an open-source property and reservation manager designed for
              owners and managers of short-term rentals. The source code is published
              under the MIT License at{" "}
              <a
                href="https://github.com/Gribadan/RentTools.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                github.com/Gribadan/RentTools.io
              </a>{" "}
              and may be self-hosted by anyone. These Terms govern only the hosted
              instance operated by us at renttools.io. If you self-host, you operate
              your own service and these Terms do not apply.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">2. Eligibility</h2>
            <p>
              You must be at least 16 years old (or older where required by your local
              law) to create an account. By signing up you confirm that you meet that
              requirement and that you have authority to accept these Terms on behalf of
              any organization for which you create an account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">3. Account &amp; security</h2>
            <p>
              You choose your username and password. You are responsible for keeping
              your credentials secret and for everything that happens under your
              account. Notify us at{" "}
              <a href={`mailto:${OPERATOR_EMAIL}`} className="text-[#58a6ff] hover:underline">{OPERATOR_EMAIL}</a>{" "}
              if you suspect unauthorized access. We may suspend or terminate accounts
              that show signs of compromise to protect other users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5 mt-2">
              <li>break any applicable law, including data-protection law;</li>
              <li>
                upload content that infringes anyone&apos;s rights, is unlawful,
                threatening, harassing, defamatory, or otherwise objectionable;
              </li>
              <li>
                hold or process personal data about a third party without a lawful
                basis (consent, hospitality-registration obligation, etc.);
              </li>
              <li>
                attempt to bypass authentication, rate limits, or access controls;
              </li>
              <li>
                probe, scan, or load-test the Service beyond ordinary use;
              </li>
              <li>
                resell, sublicense, or commercially redistribute the hosted Service
                (you can self-host the open-source code freely under MIT);
              </li>
              <li>
                use the Service to send spam, malware, or to operate any kind of
                botnet, scraper, or scraping farm;
              </li>
              <li>
                attempt to reverse-engineer or extract code or data not made available
                to you, other than by reading the public source repository.
              </li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate accounts that violate this section, with or
              without notice. We may also remove content that we believe in good faith
              violates this section.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">5. Your content and data</h2>
            <p>
              You retain ownership of all content you upload or generate using the
              Service — properties, reservations, calendar links, message templates,
              cleaning records, and guest data. You grant us a limited, non-exclusive
              licence to host, process, transmit, display, and back up that content
              solely for the purpose of providing the Service to you. We do not claim
              any rights beyond what is necessary to operate the Service.
            </p>
            <p className="mt-2">
              You can export your data at any time (Reports → CSV; Profile → Export my
              data → JSON) and delete your account immediately (Profile → Danger zone →
              Delete my account). Details of how data is stored and how long it is
              retained are in our{" "}
              <Link href="/privacy" className="text-[#58a6ff] hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">6. Guest passport data</h2>
            <p>
              When you upload guest passport photos for OCR, you act as the data
              controller for that personal data. You confirm that you have a lawful
              basis to process it (typically a hospitality-registration obligation under
              your local law) and that you have informed the guest. We act as your
              processor and will only process the data on your documented instructions.
              You are responsible for handling guest data-rights requests; we will
              assist you on request.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">7. Intellectual property</h2>
            <p>
              The RentTools source code is licensed under the MIT License — copy a copy
              with the source. The &quot;RentTools&quot; name and any logos used on
              renttools.io remain the property of the Operator and are not licensed for
              use to imply endorsement of forks or other instances. The third-party
              names mentioned in the application (Airbnb, Booking.com, Google, etc.)
              belong to their respective owners.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">8. Free service, no warranty</h2>
            <p>
              The hosted Service is provided free of charge and &quot;as is&quot; and
              &quot;as available&quot;, without warranties of any kind, whether express
              or implied — including without limitation the implied warranties of
              merchantability, fitness for a particular purpose, non-infringement, and
              uninterrupted operation. We do not warrant that the Service will be free
              of errors, that calendars will sync without delay, or that backups will
              succeed every night. If the Service is critical to your business, please
              self-host so you control your own backups, uptime, and data residency.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">9. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the Operator&apos;s
              total liability to you for all claims arising out of or related to the
              Service — whether in contract, tort, or otherwise — will not exceed the
              greater of (a) the total fees you paid us in the twelve months before the
              claim or (b) ten euros (€10). The Service is provided free of charge, so
              clause (a) is normally zero.
            </p>
            <p className="mt-2">
              We are not liable for any indirect, consequential, incidental, special,
              or punitive damages, including but not limited to lost or double-booked
              reservations, missed cleanings, calendar desync, lost guest data,
              regulatory fines you incur, or business interruption. Some jurisdictions
              do not allow these limitations; in those jurisdictions our liability is
              limited to the smallest amount allowed by law.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">10. Indemnity</h2>
            <p>
              You agree to defend and indemnify the Operator from any claim, loss, or
              cost (including reasonable lawyer&apos;s fees) arising out of (i) content
              you upload, (ii) your use of the Service in breach of these Terms, or
              (iii) your violation of any third party&apos;s rights — including the
              rights of guests whose passport data you upload.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">11. Service availability and changes</h2>
            <p>
              The hosted instance has no SLA. We aim for best-effort uptime and may take
              the Service offline for maintenance, migration, or — in extreme cases — to
              shut it down entirely. If we plan to shut the hosted instance down, we
              will notify registered users at least 30 days in advance with instructions
              to export their data. The open-source code will continue to be available
              under MIT for self-hosting regardless.
            </p>
            <p className="mt-2">
              We may add, change, or remove features without notice. We may impose or
              adjust rate limits to protect the free tier and other users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">12. Suspension &amp; termination</h2>
            <p>
              You may stop using the Service at any time and delete your account from
              the Profile panel. We may suspend or terminate your account immediately
              if (a) we reasonably believe you have breached these Terms, (b) we are
              required to do so by law, or (c) prolonged inactivity (more than 24
              months) suggests the account is abandoned. We will give you reasonable
              notice and an opportunity to export data unless doing so would harm the
              Service or other users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">13. Governing law and disputes</h2>
            <p>
              These Terms are governed by the laws of the Operator&apos;s country of
              residence, without regard to its conflict-of-laws rules. Where mandatory
              consumer-protection law of your country applies, those rules continue to
              apply in addition. The parties will try to resolve any dispute informally
              first by emailing{" "}
              <a href={`mailto:${OPERATOR_EMAIL}`} className="text-[#58a6ff] hover:underline">{OPERATOR_EMAIL}</a>.
              If that fails, the courts of the Operator&apos;s country of residence
              shall have non-exclusive jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">14. Changes to these Terms</h2>
            <p>
              We may update these Terms when the Service changes or when laws change.
              We will flag material updates inside the app and update the date at the
              top of this page. Past versions are visible in the public Git history of
              the open-source repository. Continued use of the Service after changes go
              live means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">15. Miscellaneous</h2>
            <p>
              If any clause of these Terms is held unenforceable, the rest remains in
              force. Our failure to enforce a clause is not a waiver of our right to
              enforce it later. You may not assign your rights under these Terms; we
              may assign ours to a successor that takes over operation of the Service,
              with notice to you. These Terms, together with the Privacy Policy, form
              the entire agreement between you and us about the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#e8e8ec]">16. Contact</h2>
            <p>
              Questions about these Terms or the Service: email{" "}
              <a href={`mailto:${OPERATOR_EMAIL}`} className="text-[#58a6ff] hover:underline">{OPERATOR_EMAIL}</a>.
              For public bug reports or feature requests, please file an issue at{" "}
              <a
                href="https://github.com/Gribadan/RentTools.io/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:underline"
              >
                github.com/Gribadan/RentTools.io/issues
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <p>© 2026 RentTools · MIT License</p>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-[#e8e8ec]">Home</Link>
            <Link href="/privacy" className="hover:text-[#e8e8ec]">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
