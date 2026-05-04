import { describe, it, expect, beforeEach } from "vitest";
import {
  recordFailedLogin,
  isAccountLocked,
  clearFailedLoginAttempts,
  _resetForTests,
  ACCOUNT_LOCKOUT_THRESHOLD,
  ACCOUNT_LOCKOUT_WINDOW_SECONDS,
  ACCOUNT_LOCKOUT_DURATION_SECONDS,
} from "./account-lockout";

const T0 = 1_700_000_000_000;

describe("account-lockout", () => {
  beforeEach(() => {
    _resetForTests();
  });

  it("starts unlocked with no failures", () => {
    const state = isAccountLocked("alice", T0);
    expect(state).toEqual({ locked: false, secondsRemaining: 0, failures: 0 });
  });

  it("counts failures up to the threshold without locking", () => {
    for (let i = 1; i < ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      const state = recordFailedLogin("alice", T0 + i * 1000);
      expect(state.locked).toBe(false);
      expect(state.failures).toBe(i);
    }
  });

  it("locks the account on the threshold failure", () => {
    let state;
    for (let i = 1; i <= ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      state = recordFailedLogin("alice", T0 + i * 1000);
    }
    expect(state!.locked).toBe(true);
    expect(state!.failures).toBe(ACCOUNT_LOCKOUT_THRESHOLD);
    expect(state!.secondsRemaining).toBeGreaterThan(0);
    expect(state!.secondsRemaining).toBeLessThanOrEqual(ACCOUNT_LOCKOUT_DURATION_SECONDS);
  });

  it("isAccountLocked reports the active lock without bumping the counter", () => {
    for (let i = 1; i <= ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      recordFailedLogin("alice", T0 + i * 1000);
    }
    const state = isAccountLocked("alice", T0 + 60_000);
    expect(state.locked).toBe(true);
    expect(state.failures).toBe(ACCOUNT_LOCKOUT_THRESHOLD);
  });

  it("unlocks after the lockout duration elapses", () => {
    for (let i = 1; i <= ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      recordFailedLogin("alice", T0 + i * 1000);
    }
    const afterUnlock = T0 + (ACCOUNT_LOCKOUT_DURATION_SECONDS + 60) * 1000;
    expect(isAccountLocked("alice", afterUnlock).locked).toBe(false);
  });

  it("rolls the failure window so old failures don't accumulate forever", () => {
    // 5 failures, then wait beyond the rolling window — counter resets.
    for (let i = 1; i <= 5; i++) {
      recordFailedLogin("alice", T0 + i * 1000);
    }
    const farFuture = T0 + (ACCOUNT_LOCKOUT_WINDOW_SECONDS + 60) * 1000;
    const state = recordFailedLogin("alice", farFuture);
    expect(state.failures).toBe(1);
    expect(state.locked).toBe(false);
  });

  it("isolates lockouts per username — alice's failures don't lock bob", () => {
    for (let i = 1; i <= ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      recordFailedLogin("alice", T0 + i * 1000);
    }
    expect(isAccountLocked("bob", T0 + 60_000).locked).toBe(false);
    expect(isAccountLocked("alice", T0 + 60_000).locked).toBe(true);
  });

  it("clearFailedLoginAttempts wipes the counter after a successful login", () => {
    for (let i = 1; i < ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      recordFailedLogin("alice", T0 + i * 1000);
    }
    clearFailedLoginAttempts("alice");
    expect(isAccountLocked("alice", T0 + 60_000).failures).toBe(0);
  });

  it("normalises username casing + surrounding whitespace", () => {
    recordFailedLogin("Alice", T0);
    recordFailedLogin("  alice  ", T0 + 1000);
    expect(isAccountLocked("ALICE", T0 + 2000).failures).toBe(2);
  });
});
