import { NextResponse } from "next/server";
import { getSetting } from "@/lib/site-settings";

// Public, unauthenticated endpoint exposing the SAFE subset of
// SiteSettings used by the marketing/landing/signup pages. Never add
// internal-only keys here — anything returned is world-readable.
export async function GET() {
  try {
    const [signupEnabled, landingAnnouncement, supportEmail] = await Promise.all([
      getSetting("signup_enabled", "true"),
      getSetting("landing_announcement", ""),
      getSetting("support_email", ""),
    ]);
    return NextResponse.json({
      signup_enabled: signupEnabled === "true",
      landing_announcement: landingAnnouncement,
      support_email: supportEmail,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
