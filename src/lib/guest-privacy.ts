// Guest travel-document privacy.
//
// A host always sees their own guests' passport / ID data in full — it's
// theirs. But when a RentTools superadmin is *impersonating* a host for
// support, these document fields are redacted from every API response,
// so support can still operate the account (calendar, settings, sync)
// without ever reading a guest's passport details.
//
// This is what backs the assurance shown on the reservation page that
// RentTools staff cannot view uploaded passport documents. Redaction is
// applied at the API layer (guest list, guest search, data export) so
// there is no path — UI, search, or export — that leaks the data to an
// impersonating session.

const MASKED_GUEST_FIELDS = [
  "passportNumber",
  "dateOfBirth",
  "dateOfIssue",
  "expiryDate",
  "issuedBy",
  "citizenshipCode",
  "country",
  "visaNumber",
  "visaFrom",
  "visaTo",
] as const;

const MASK = "••••••";

/**
 * Redact passport / ID fields on a guest-shaped object when `redact` is
 * true (i.e. the request is from an impersonating superadmin). Returns
 * the object unchanged otherwise. Non-document fields — name, phone,
 * notes — are left intact so support can still identify the reservation.
 */
export function maskGuestDocs<T>(guest: T, redact: boolean): T {
  if (!redact) return guest;
  const out = { ...(guest as Record<string, unknown>) };
  for (const field of MASKED_GUEST_FIELDS) {
    if (typeof out[field] === "string" && out[field] !== "") {
      out[field] = MASK;
    }
  }
  return out as T;
}
