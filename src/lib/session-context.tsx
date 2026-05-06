"use client";

import { createContext, useContext } from "react";

// Minimal session shape exposed to client components. We deliberately
// don't ship the JWT or the full user record into the client context —
// MarketingHeader only needs to know "is someone signed in?" to swap
// the Sign in / Get started buttons for a Dashboard link. Anything
// beyond that (real auth) still goes through the server.
export interface ClientSession {
  userId: number;
  username: string;
  role: string;
}

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: ClientSession | null;
}) {
  return (
    <SessionContext.Provider value={initialSession}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Read the server-resolved session inside a client component. Returns
 * null when no one is signed in. Static for the lifetime of the page —
 * sign-in / sign-out causes a full navigation, which re-runs the server
 * resolver and re-hydrates the provider.
 */
export function useSession(): ClientSession | null {
  return useContext(SessionContext);
}
