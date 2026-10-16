"use client";

import { useEffect, useRef } from "react";
import { subscribeLiveRefresh } from "@/lib/live-refresh-connection";

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
 * Pass `intervalMs = 0` to disable polling while retaining push and
 * browser resume refreshes.
 *
 * A shared SSE connection also refreshes visible views after committed
 * calendar changes. The interval and browser resume events recover from
 * missed notifications, blocked streams and suspended mobile tabs.
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
    let disposed = false;

    const runIfVisible = () => {
      if (disposed || document.visibilityState !== "visible") return;
      void Promise.resolve().then(() => {
        if (!disposed) return refetchRef.current();
      }).catch(() => {});
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
        runIfVisible();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();
    const unsubscribe = subscribeLiveRefresh(runIfVisible);

    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);
    window.addEventListener("pageshow", onVisibilityOrFocus);
    window.addEventListener("online", onVisibilityOrFocus);

    return () => {
      disposed = true;
      unsubscribe();
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
      window.removeEventListener("pageshow", onVisibilityOrFocus);
      window.removeEventListener("online", onVisibilityOrFocus);
    };
  }, [intervalMs]);
}
