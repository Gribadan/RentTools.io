import { notFound } from "next/navigation";
import { GuestFormView } from "@/components/guest-form-filler";
import { sanitizeI18n, type GuestFormI18n } from "@/lib/guest-form-i18n";
import { findSubmissionByPublicToken, publicSubmissionState } from "@/lib/guest-form-security";
import { decryptGuestData } from "@/lib/precheckin-crypto";
import type { PrecheckinDraft } from "@/lib/precheckin";

// RT-25.2 — public pre-arrival guest form. Reachable via the share
// link the host generated for a specific reservation. Token possession
// is the only auth — middleware adds /g/ to PUBLIC_PATHS.

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  helpText?: string;
  options?: string[];
}

export default async function GuestFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 32 || token.length > 180) notFound();

  const submission = await findSubmissionByPublicToken(token);
  if (!submission) notFound();
  const linkState = publicSubmissionState(submission);

  const fields: FormField[] = JSON.parse(submission.template.fields);
  let i18n: GuestFormI18n = {};
  try {
    i18n = sanitizeI18n(JSON.parse(submission.template.i18n || "{}"));
  } catch {
    // Malformed JSON — fall back to English-only.
  }
  let initialPrecheckin: PrecheckinDraft | null = null;
  let storageError = false;
  if (linkState === "active" && submission.securePayload) {
    try {
      initialPrecheckin = decryptGuestData<PrecheckinDraft>(submission.securePayload);
    } catch {
      // Never replace an unreadable encrypted draft with an apparently empty
      // form: that would invite the guest to overwrite recoverable data.
      storageError = true;
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec] py-10 px-4">
      <main className="mx-auto max-w-xl">
        <GuestFormView
          token={token}
          templateName={submission.template.name}
          fields={fields}
          i18n={i18n}
          propertyName={submission.reservation.property.name}
          guestName={submission.reservation.name}
          checkIn={submission.reservation.checkIn.toISOString().slice(0, 10)}
          checkOut={submission.reservation.checkOut.toISOString().slice(0, 10)}
          maxTravelers={submission.reservation.bookedGuestCount ?? null}
          initialPrecheckin={initialPrecheckin}
          linkState={storageError ? "storage-error" : linkState}
          alreadySubmitted={linkState === "submitted"}
          submittedAt={
            submission.submittedAt
              ? submission.submittedAt.toISOString().slice(0, 10)
              : null
          }
        />
      </main>
    </div>
  );
}
