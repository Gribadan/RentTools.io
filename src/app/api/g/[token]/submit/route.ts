import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// RT-25.2 — public submit endpoint for the pre-arrival guest form.
// Anyone with the share token can POST once; subsequent POSTs to an
// already-submitted token are rejected so a stale link can't be reused
// by an unintended party. The request is gated by token possession
// only, no auth — that's the whole point of the share link.

interface AnswerOut {
  fieldId: string;
  type: string;
  label: string;
  value: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const submission = await prisma.guestFormSubmission.findUnique({
      where: { shareToken: token },
      include: { template: true },
    });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (submission.submittedAt) {
      return NextResponse.json(
        { error: "This form has already been submitted." },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);
    const incoming = body?.answers;
    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const fields: Array<{
      id: string;
      type: string;
      label: string;
      required: boolean;
    }> = JSON.parse(submission.template.fields);

    const answers: AnswerOut[] = [];
    for (const f of fields) {
      const raw = (incoming as Record<string, unknown>)[f.id];
      const isEmpty =
        raw === undefined ||
        raw === null ||
        raw === "" ||
        (Array.isArray(raw) && raw.length === 0);
      if (f.required && isEmpty) {
        return NextResponse.json(
          { error: `Required: ${f.label || f.id}` },
          { status: 400 }
        );
      }
      answers.push({
        fieldId: f.id,
        type: f.type,
        label: f.label,
        value: isEmpty ? null : raw,
      });
    }

    await prisma.guestFormSubmission.update({
      where: { id: submission.id },
      data: {
        answers: JSON.stringify(answers),
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
