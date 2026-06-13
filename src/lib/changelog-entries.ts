// ============================================================================
//  How to update this file
// ============================================================================
//
//  The /changelog page is rendered straight from this array. To add a new
//  release entry, prepend (NOT append — newest goes first) a new object to
//  the CHANGELOG export below. Keep the file short, the entries shorter, and
//  the language user-facing.
//
//  ── What belongs here ──────────────────────────────────────────────────────
//
//   - New user-facing capabilities ("added")
//   - Meaningful UX or behaviour improvements ("improved")
//   - Bug fixes a real user could have noticed ("fixed")
//
//  ── What does NOT belong here ──────────────────────────────────────────────
//
//   - Internal refactors, code cleanups, dependency bumps
//   - Type-only or build-pipeline changes
//   - Anything purely cosmetic that nobody would notice
//   - Implementation detail ("rewrote the calendar in a new framework")
//   - New blog posts (they have their own /blog index)
//   - Marketing copy edits
//
//  ── Writing rules ──────────────────────────────────────────────────────────
//
//   1. ONE sentence per entry. Aim for 12 words; never exceed ~25.
//   2. Start with the user-facing verb-phrase, not the file or area:
//        - GOOD: "Pre-arrival form now auto-saves as you type."
//        - BAD:  "Refactored guest-form-page.tsx to debounce PUT requests."
//   3. Lead with the user benefit; mention the surface in passing if needed.
//   4. No commit SHAs, ticket IDs, file paths, function names, or jargon.
//   5. Past-tense or present-tense both fine; be consistent within a date.
//   6. Don't promote tiny things to "added" if they're really "improved".
//   7. If you ship 10 small fixes in a day, group them. Two well-chosen lines
//      beat ten bullet-pointed nits — users skim.
//
//  ── Grouping ───────────────────────────────────────────────────────────────
//
//   - One ChangelogEntry per release-day (deploy date). Multiple commits on
//     the same date roll up into the same entry's `changes` array.
//   - Within an entry, the renderer orders sections automatically:
//     Added → Improved → Fixed. Don't worry about the order you write them in.
//   - If you ship something pre-announced, link to the blog post it relates
//     to with markdown-ish syntax in the text — render keeps it as plain
//     text for now, so plain prose is fine.
//
//  ── Date format ────────────────────────────────────────────────────────────
//
//   - `date: "YYYY-MM-DD"` — the date the change reached production. The
//     /changelog page displays each date verbatim, so the literal value here
//     is what users see.
//
//  ── When NOT to add an entry ───────────────────────────────────────────────
//
//   - If everything you shipped today is in the "does not belong" list above.
//   - That's a fine outcome — the changelog isn't a commit log. Empty days
//     are normal; nobody is judging you for shipping refactors.
//
// ============================================================================

export type ChangelogKind = "added" | "improved" | "fixed";

export interface ChangelogChange {
  kind: ChangelogKind;
  text: string;
}

export interface ChangelogEntry {
  /** ISO date the change reached production. Displayed verbatim. */
  date: string;
  /** Optional one-line headline shown above the bullets. Skip on routine
   *  release days — most entries don't need it. Use only when the day has
   *  a single dominant theme worth naming up front. */
  headline?: string;
  changes: ChangelogChange[];
}

// Newest first. The renderer never sorts — order here is order shown.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-06-13",
    changes: [
      {
        kind: "fixed",
        text: "When you cancel a booking on a connected platform, it now clears from your calendar on the next sync — even one you'd already named — instead of lingering as a ghost reservation.",
      },
    ],
  },
  {
    date: "2026-05-25",
    headline: "Privacy panel, reservation-level messenger, form auto-save",
    changes: [
      {
        kind: "added",
        text: "Every pre-arrival form now opens with a Privacy & data handling panel — who sees the answers, where they're stored, no-tracking guarantee, and GDPR rights. Translated into all 5 languages.",
      },
      {
        kind: "added",
        text: "Save a guest phone directly on the reservation and open a personal WhatsApp or Telegram chat in one click — works for any booking, including ones with no passport data.",
      },
      {
        kind: "improved",
        text: "The pre-arrival form builder now auto-saves as you type. The old Save form button is gone; a live status chip shows when your changes are persisted.",
      },
      {
        kind: "improved",
        text: "Auto-generated group-chat names now use \" - \" between the parts instead of \" | \" for cleaner reading in messenger lists.",
      },
    ],
  },
  {
    date: "2026-05-23",
    headline: "Multi-language pre-arrival form, mobile polish, Google account fixes",
    changes: [
      {
        kind: "added",
        text: "Pre-arrival form is now multi-language. Translate it once into any of the 4 non-English locales; guests pick their language on the share link, with per-string English fallback for anything you leave blank.",
      },
      {
        kind: "added",
        text: "Cleaning and Reports views now pin a property switcher to the top of the page on mobile, so changing scope no longer means scrolling past the whole table.",
      },
      {
        kind: "added",
        text: "Pre-arrival form builder ships with one-tap suggested questions — most common host questions pre-typed with the right field type.",
      },
      {
        kind: "added",
        text: "Google-sign-in accounts can now set a password and use password-based flows like deletion.",
      },
      {
        kind: "added",
        text: "Footer now includes an Advertise contact link for partnership inquiries.",
      },
      {
        kind: "fixed",
        text: "iOS no longer zooms in when you focus a form field — controls now use 16px text on small screens.",
      },
      {
        kind: "fixed",
        text: "Pre-arrival form fields and long blog breadcrumb titles no longer overflow the screen on mobile.",
      },
      {
        kind: "fixed",
        text: "Pre-arrival form share-link copy button now works on mobile.",
      },
    ],
  },
  {
    date: "2026-05-22",
    headline: "Full-width layouts, email-verified signup, status page",
    changes: [
      {
        kind: "added",
        text: "Dedicated full-page pre-arrival form builder with live guest preview.",
      },
      {
        kind: "added",
        text: "Sign up with email verification and reset your password via email — codes delivered through Resend.",
      },
      {
        kind: "added",
        text: "Rename a property directly from the dashboard header or any property card.",
      },
      {
        kind: "added",
        text: "Editable group-chat name on every reservation with a one-click Copy button.",
      },
      {
        kind: "added",
        text: "status.renttools.io now reports live uptime and incident history.",
      },
      {
        kind: "improved",
        text: "Dashboard, reservation, and sync-settings views rebuilt as full-width responsive layouts.",
      },
      {
        kind: "improved",
        text: "Feedback form translated into all 5 languages.",
      },
      {
        kind: "improved",
        text: "Password minimum lowered from 12 to 8 characters; auth screens switch language in place without reloading.",
      },
      {
        kind: "fixed",
        text: "Manual Sync now button is gated by a confirm dialog and rate limit so it can't accidentally spam every property.",
      },
      {
        kind: "fixed",
        text: "iCal-synced bookings no longer render as striped extension bars on the calendar.",
      },
    ],
  },
];
