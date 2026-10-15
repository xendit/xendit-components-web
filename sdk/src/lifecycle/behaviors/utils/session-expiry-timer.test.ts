import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_TIMEOUT_MS, SessionExpiryTimer } from "./session-expiry-timer";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

describe("SessionExpiryTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("never elapses without a TTL", () => {
    const onElapsed = vi.fn();
    const timer = new SessionExpiryTimer(onElapsed);

    timer.start(undefined);
    vi.advanceTimersByTime(MAX_TIMEOUT_MS);

    expect(timer.hasElapsed()).toBe(false);
    expect(onElapsed).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("elapses exactly when the TTL runs out", () => {
    const onElapsed = vi.fn();
    const timer = new SessionExpiryTimer(onElapsed);

    timer.start(600);
    vi.advanceTimersByTime(599_999);
    expect(timer.hasElapsed()).toBe(false);
    expect(onElapsed).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(timer.hasElapsed()).toBe(true);
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it("is elapsed right away for a TTL of zero, without a timeout or callback", () => {
    const onElapsed = vi.fn();
    const timer = new SessionExpiryTimer(onElapsed);

    timer.start(0);

    expect(timer.hasElapsed()).toBe(true);
    expect(onElapsed).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits in chunks for a TTL longer than setTimeout allows", () => {
    const onElapsed = vi.fn();
    const timer = new SessionExpiryTimer(onElapsed);

    timer.start(THIRTY_DAYS_MS / 1000);
    vi.advanceTimersByTime(MAX_TIMEOUT_MS);
    expect(timer.hasElapsed()).toBe(false);

    vi.advanceTimersByTime(THIRTY_DAYS_MS - MAX_TIMEOUT_MS - 1);
    expect(timer.hasElapsed()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(timer.hasElapsed()).toBe(true);
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it("replaces the previous countdown when started again", () => {
    const onElapsed = vi.fn();
    const timer = new SessionExpiryTimer(onElapsed);

    timer.start(600);
    vi.advanceTimersByTime(300_000);
    timer.start(1200);

    vi.advanceTimersByTime(300_000); // the old deadline
    expect(onElapsed).not.toHaveBeenCalled();

    vi.advanceTimersByTime(900_000); // the new deadline
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it("stop cancels the countdown and clears the flag", () => {
    const onElapsed = vi.fn();
    const timer = new SessionExpiryTimer(onElapsed);

    timer.start(0);
    timer.stop();
    expect(timer.hasElapsed()).toBe(false);

    timer.start(600);
    timer.stop();
    vi.advanceTimersByTime(600_000);

    expect(timer.hasElapsed()).toBe(false);
    expect(onElapsed).not.toHaveBeenCalled();
  });
});
