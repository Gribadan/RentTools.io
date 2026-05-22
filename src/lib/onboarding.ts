import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const ONBOARD_COOKIE = "rt-onboard-token";

interface DraftLink {
  platform: string;
  customName?: string;
  color?: string;
  icalExportUrl: string;
  lastTestStatus?: "valid" | "invalid";
}

function isLinkArray(value: unknown): value is DraftLink[] {
  return (
    Array.isArray(value) &&
    value.every(
      (l) =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as { platform?: unknown }).platform === "string" &&
        typeof (l as { icalExportUrl?: unknown }).icalExportUrl === "string",
    )
  );
}

function parseLinks(raw: string): DraftLink[] {
  try {
    const parsed = JSON.parse(raw);
    return isLinkArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * If the visitor has an unclaimed onboarding draft cookie, materialise its
 * propertyName + links as a real Property + CalendarLink rows for the user
 * who just signed up (via username/password OR Google). Best-effort: any
 * failure here is logged but doesn't break signup, since the user can
 * re-create the property manually from the dashboard.
 */
export async function claimOnboardingDraft(userId: number): Promise<void> {
  try {
    const jar = await cookies();
    const token = jar.get(ONBOARD_COOKIE)?.value;
    if (!token) return;

    const draft = await prisma.onboardingDraft.findUnique({ where: { sessionToken: token } });
    if (!draft || draft.claimedByUserId) {
      jar.delete(ONBOARD_COOKIE);
      return;
    }

    const parsedLinks = parseLinks(draft.links);
    const propertyName = draft.propertyName.trim() || "My first property";

    // Carry the draft's feedSlug onto the new Property so any feed URL
    // the visitor already pasted into Airbnb / Booking continues to
    // resolve to their account after signup. Without this the URL
    // would 404 the moment we delete the draft.
    const property = await prisma.property.create({
      data: {
        name: propertyName,
        userId,
        minNights: 1,
        feedSlug: draft.feedSlug ?? undefined,
      },
    });
    await logAudit(userId, "create", "property", property.id, { name: property.name, fromOnboarding: true });

    for (const link of parsedLinks) {
      if (!link.icalExportUrl.trim()) continue;
      try {
        const created = await prisma.calendarLink.create({
          data: {
            propertyId: property.id,
            platform: link.platform,
            icalExportUrl: link.icalExportUrl.trim(),
          },
        });
        await logAudit(userId, "create", "calendarLink", created.id, {
          platform: link.platform,
          propertyId: property.id,
          fromOnboarding: true,
        });
      } catch {
        // Bad URL or schema-rejected platform — skip but keep the property.
      }
    }

    await prisma.onboardingDraft.update({
      where: { id: draft.id },
      data: { claimedByUserId: userId, claimedAt: new Date() },
    });

    jar.delete(ONBOARD_COOKIE);
  } catch (err) {
    console.error("Onboarding claim failed:", err);
  }
}
