import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";

// Field shape stored in GuestFormTemplate.fields (JSON). Kept in sync
// with the schema comment in prisma/schema.prisma. Validated at write
// time so a malformed PUT body cannot poison the JSON column.
type FieldType =
  | "short-text"
  | "long-text"
  | "number"
  | "email"
  | "select"
  | "multi-select"
  | "date"
  | "time"
  | "yes-no"
  | "phone";

const FIELD_TYPES: ReadonlySet<string> = new Set<FieldType>([
  "short-text",
  "long-text",
  "number",
  "email",
  "select",
  "multi-select",
  "date",
  "time",
  "yes-no",
  "phone",
]);

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  /** Optional helper text shown under the question on the guest form. */
  helpText?: string;
  options?: string[];
}

function sanitizeFields(input: unknown): FormField[] {
  if (!Array.isArray(input)) return [];
  const out: FormField[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const type = typeof r.type === "string" && FIELD_TYPES.has(r.type) ? (r.type as FieldType) : null;
    if (!type) continue;
    const id = typeof r.id === "string" && r.id ? r.id : crypto.randomUUID();
    const label = typeof r.label === "string" ? r.label.slice(0, 200) : "";
    const required = r.required === true;
    const field: FormField = { id, type, label, required };
    if (typeof r.helpText === "string" && r.helpText.trim()) {
      field.helpText = r.helpText.slice(0, 300);
    }
    if (type === "select" || type === "multi-select") {
      const opts = Array.isArray(r.options)
        ? r.options.filter((o): o is string => typeof o === "string").slice(0, 50)
        : [];
      field.options = opts;
    }
    out.push(field);
    if (out.length >= 50) break; // hard cap on fields per template
  }
  return out;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (!(await canManageProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.guestFormTemplate.findFirst({
      where: { propertyId: numId },
      orderBy: { createdAt: "asc" },
    });
    if (!template) return NextResponse.json({ template: null });

    const fields = sanitizeFields(JSON.parse(template.fields));
    return NextResponse.json({
      template: {
        id: template.id,
        propertyId: template.propertyId,
        name: template.name,
        fields,
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (!(await canManageProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.slice(0, 200) : "";
    const fields = sanitizeFields(body?.fields);
    const fieldsJson = JSON.stringify(fields);

    const existing = await prisma.guestFormTemplate.findFirst({
      where: { propertyId: numId },
      orderBy: { createdAt: "asc" },
    });

    const saved = existing
      ? await prisma.guestFormTemplate.update({
          where: { id: existing.id },
          data: { name, fields: fieldsJson, updatedAt: new Date() },
        })
      : await prisma.guestFormTemplate.create({
          data: { propertyId: numId, name, fields: fieldsJson },
        });

    await logAudit(session.userId, existing ? "update" : "create", "guestFormTemplate", saved.id, {
      name,
      fieldCount: fields.length,
    });

    return NextResponse.json({
      template: {
        id: saved.id,
        propertyId: saved.propertyId,
        name: saved.name,
        fields,
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
