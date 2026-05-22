import { useEffect, useState } from "react";

const STORAGE_KEY = "rt-cleaning-include-potential";

/**
 * The cleaning schedule's "include potential cleanings" toggle, persisted
 * to localStorage so the host's choice survives reloads and navigation.
 *
 * Defaults to OFF — potential cleanings are speculative (they only matter
 * if a gap-fill guest books), so the host opts in rather than out. The
 * saved value is read after mount (localStorage is client-only); the
 * cleaning views are in a loading state on first paint anyway, so the
 * stored value lands before the schedule is visible — no flash.
 */
export function useIncludePotential(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setValue(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — keep the default
    }
  }, []);

  const set = (next: boolean) => {
    setValue(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
    } catch {
      // ignore — the in-memory value still works for this session
    }
  };

  return [value, set];
}
