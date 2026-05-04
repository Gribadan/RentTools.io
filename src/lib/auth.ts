import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

const COOKIE_NAME = "rent-tool-session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number, username: string, role: string) {
  const token = await new SignJWT({ userId, username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<{
  userId: number;
  username: string;
  role: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const session = payload as { userId: number; username: string; role: string };

    // Suspended users (RT-15.11) are kicked on the next request: clear the
    // cookie and return null so the client is redirected to /login.
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { suspendedAt: true },
      });
      if (!user || user.suspendedAt) {
        // Cookie deletion only works in mutable contexts (route handlers /
        // server actions); swallow the error if we're in a server component.
        try {
          cookieStore.delete(COOKIE_NAME);
        } catch {}
        return null;
      }
    } catch {
      // If the DB check fails, fail closed and treat as no session.
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

type Session = { userId: number; username: string; role: string };

export type RequireSuperadminResult =
  | { session: Session; response: null }
  | { session: null; response: NextResponse };

export async function requireSuperadmin(): Promise<RequireSuperadminResult> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.role !== "superadmin") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, response: null };
}
