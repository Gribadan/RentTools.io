"use client";

import { useEffect, useRef } from "react";

/**
 * Keep the current view eventually-consistent with what's in the DB by
 * re-running `refetch()` under two triggers:
 *
 *   (a) whenever the tab regains focus / visibility — a manager who
 *       Alt-Tabs back to their browser sees the latest data
 *       immediately, without a full page reload;
 *   (b) on an interval while the tab is visible — a manager who stays
 *       on the calendar sees changes from another manager within
 *       `intervalMs` (default 60 s).
 *
 * The interval is paused while the tab is hidden so a backgrounded
 * dashboard doesn't hammer the API. When the tab becomes visible
 * again, we fire an immediate refetch and then resume polling.
 *
 * `refetch` may capture state — pass a stable useCallback reference so
 * the effect doesn't tear down / rebuild the interval on every render.
 * Pass `intervalMs = 0` to disable polling and rely on focus refresh
 * alone.
 *
 * Why this instead of SSE / websockets? Multi-manager visibility is
 * the primary need here, not sub-second latency. Focus + 60 s polling
 * covers the common cases (Manager A adds a booking, Manager B sees
 * it within a minute or the next time they focus their tab) with zero
 * server-side changes. If real-time push becomes a requirement, the
 * refetch call-sites stay the same — swap this hook for an SSE
 * subscription and the rest of the code doesn't change.
 */
export function useLiveRefresh(
  refetch: () => void | Promise<void>,
  intervalMs = 60_000,
): void {
  // Keep the latest refetch inside a ref so the event listeners /
  // interval always call the freshest closure without our effect
  // needing to re-register them on every render.
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const runIfVisible = () => {
      if (document.visibilityState === "visible") {
        void refetchRef.current();
      }
    };

    const startPolling = () => {
      if (interval || intervalMs <= 0) return;
      interval = setInterval(runIfVisible, intervalMs);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refetchRef.current();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();

    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [intervalMs]);
}
