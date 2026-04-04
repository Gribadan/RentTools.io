import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.appSettings.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    // Mask API keys for non-superadmin
    if (s.key === "gemini_api_key" && session.role !== "superadmin") {
      map[s.key] = s.value ? "****" + s.value.slice(-4) : "";
    } else {
      map[s.key] = s.value;
    }
  }
  return NextResponse.json(map);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await request.json();
  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  await prisma.appSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json({ success: true });
}
