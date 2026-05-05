import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GuestFormFiller } from "@/components/guest-form-filler";

// RT-25.2 — public pre-arrival guest form. Reachable via the share
// link the host generated for a specific reservation. Token possession
// is the only auth — middleware adds /g/ to PUBLIC_PATHS.

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export default async function GuestFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const submission = await prisma.guestFormSubmission.findUnique({
    where: { shareToken: token },
    include: {
      template: true,
      reservation: {
        select: {
          name: true,
          checkIn: true,
          checkOut: true,
          property: { select: { name: true } },
        },
      },
    },
  });
  if (!submission) notFound();

  const fields: FormField[] = JSON.parse(submission.template.fields);
  const alreadySubmitted = !!submission.submittedAt;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec] py-10 px-4">
      <main className="mx-auto max-w-xl">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-[#a0a0a8]">
            {submission.reservation.property.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {submission.template.name || "Pre-arrival form"}
          </h1>
          <p className="mt-2 text-sm text-[#a0a0a8]">
            Hi {submission.reservation.name}, please answer a few questions before your stay.
          </p>
        </header>

        {alreadySubmitted ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-5">
            <p className="text-sm font-medium text-emerald-300">
              Thanks — your answers are recorded.
            </p>
            <p className="mt-1 text-xs text-[#a0a0a8]">
              Submitted {submission.submittedAt!.toISOString().slice(0, 10)}
            </p>
          </div>
        ) : (
          <GuestFormFiller token={token} fields={fields} />
        )}
      </main>
    </div>
  );
}
