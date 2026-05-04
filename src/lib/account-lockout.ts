/**
 * Per-username account lockout (RT-21.5). Layered on top of the per-IP
 * `checkRateLimit` so an attacker can't brute-force one username from
 * many IPs without tripping a username-scoped lock.
 *
 * State is in-memory and per-process (same trade-off as rate-limit.ts:
 * fine for the single-droplet deployment, swap for Redis if we ever
 * scale horizontally). Lockouts vanish on restart, which we accept —
 * the auth flow still re-locks anyone who keeps failing.
 *
 * Knobs (from the task spec):
 *   - 10 failures inside a 30-minute rolling window → 30-minute lockout
 *   - lockout is independent of IP rate limit; both can fire
 *   - on successful login, the counter resets so a memory leak doesn't
 *     accumulate stale entries for legit users
 */

interface AttemptRecord {
  failures: number;
  // First failure of the current window — used to roll the window once
  // it expires without locking.
  windowStart: number;
  // Set when the threshold was crossed; null otherwise.
  lockedUntil: number | null;
}

const FAILURE_THRESHOLD = 10;
const WINDOW_SECONDS = 30 * 60;
const LOCKOUT_SECONDS = 30 * 60;

const records = new Map<string, AttemptRecord>();

let lastCleanup = Date.now();
function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, rec] of records) {
    // Drop stale entries: window long elapsed AND not currently locked.
    const windowExpired = now - rec.windowStart > WINDOW_SECONDS * 1000;
    const lockExpired = rec.lockedUntil === null || rec.lockedUntil < now;
    if (windowExpired && lockExpired) records.delete(key);
  }
}

function normaliseKey(username: string): string {
  return username.trim().toLowerCase();
}

export interface LockoutState {
  locked: boolean;
  /** Seconds remaining on the active lock. Zero when not locked. */
  secondsRemaining: number;
  /** Number of failures recorded inside the current rolling window. */
  failures: number;
}

/**
 * Inspect lockout state without mutating it. Call before validating the
 * password so a locked account can return 429 without exposing whether
 * the password was right.
 */
export function isAccountLocked(username: string, now: number = Date.now()): LockoutState {
  cleanup(now);
  const key = normaliseKey(username);
  const rec = records.get(key);
  if (!rec) return { locked: false, secondsRemaining: 0, failures: 0 };

  if (rec.lockedUntil !== null && rec.lockedUntil > now) {
    return {
      locked: true,
      secondsRemaining: Math.ceil((rec.lockedUntil - now) / 1000),
      failures: rec.failures,
    };
  }

  // Roll the window — if the first failure is older than the window,
  // the count is stale.
  if (now - rec.windowStart > WINDOW_SECONDS * 1000) {
    return { locked: false, secondsRemaining: 0, failures: 0 };
  }

  return { locked: false, secondsRemaining: 0, failures: rec.failures };
}

/**
 * Record a failed login for the given username. Returns the post-record
 * state so the caller can decide whether to surface a "locked" message.
 */
export function recordFailedLogin(username: string, now: number = Date.now()): LockoutState {
  cleanup(now);
  const key = normaliseKey(username);
  const existing = records.get(key);

  // Window has rolled — start fresh.
  if (!existing || now - existing.windowStart > WINDOW_SECONDS * 1000) {
    const fresh: AttemptRecord = { failures: 1, windowStart: now, lockedUntil: null };
    records.set(key, fresh);
    return { locked: false, secondsRemaining: 0, failures: 1 };
  }

  // Inside the window — increment.
  existing.failures += 1;

  if (existing.failures >= FAILURE_THRESHOLD && existing.lockedUntil === null) {
    existing.lockedUntil = now + LOCKOUT_SECONDS * 1000;
  }

  if (existing.lockedUntil !== null && existing.lockedUntil > now) {
    return {
      locked: true,
      secondsRemaining: Math.ceil((existing.lockedUntil - now) / 1000),
      failures: existing.failures,
    };
  }

  return { locked: false, secondsRemaining: 0, failures: existing.failures };
}

/**
 * Drop any failure record for the given username. Call on a successful
 * login so a legitimate user who got their password right on attempt 9
 * doesn't carry a partial counter into the next session.
 */
export function clearFailedLoginAttempts(username: string): void {
  records.delete(normaliseKey(username));
}

// Test-only: allow specs to start with a clean slate.
export function _resetForTests(): void {
  records.clear();
  lastCleanup = Date.now();
}

export const ACCOUNT_LOCKOUT_THRESHOLD = FAILURE_THRESHOLD;
export const ACCOUNT_LOCKOUT_WINDOW_SECONDS = WINDOW_SECONDS;
export const ACCOUNT_LOCKOUT_DURATION_SECONDS = LOCKOUT_SECONDS;
