import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setTimeoutLong } from "./set-timeout-long";

describe("setTimeoutLong", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls back exactly when the delay has passed", () => {
    const callback = vi.fn();
    setTimeoutLong(callback, 600_000);

    vi.advanceTimersByTime(599_999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("waits for a delay longer than setTimeout allows", () => {
    const callback = vi.fn();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    setTimeoutLong(callback, thirtyDays);

    vi.advanceTimersByTime(thirtyDays - 1);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("calls back within one chunk after the device slept past the deadline", () => {
    const callback = vi.fn();
    setTimeoutLong(callback, 600_000);

    // the clock jumps an hour ahead while pending timeouts keep their remaining time, like a sleeping device
    vi.setSystemTime(Date.now() + 3_600_000);

    vi.advanceTimersByTime(299_999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("never calls back before the clock reaches the deadline", () => {
    const callback = vi.fn();
    setTimeoutLong(callback, 1000);

    // the clock is set back a second, so the timeout fires before the deadline
    vi.setSystemTime(Date.now() - 1000);

    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cancels, even after a chunk has run", () => {
    const callback = vi.fn();
    const cancel = setTimeoutLong(callback, 600_000);

    vi.advanceTimersByTime(300_000);
    cancel();
    vi.advanceTimersByTime(600_000);

    expect(callback).not.toHaveBeenCalled();
  });

  it("calls back asynchronously when the delay has already passed", () => {
    const callback = vi.fn();
    setTimeoutLong(callback, -5);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
