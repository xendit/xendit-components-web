/**
 * Browsers store setTimeout delays as a 32-bit signed integer,anything larger overflows and fires immediately.
 */
export const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Counts down a session's expires_ttl and reports when it reaches zero.
 * Long TTLs (sessions can last 30 days) are waited for in chunks of at most MAX_TIMEOUT_MS.
 */
export class SessionExpiryTimer {
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private remainingMs = 0;
  private elapsed = false;

  constructor(private onElapsed: () => void) {}

  /**
   * Starts counting down from ttlSeconds, replacing any previous countdown.
   */
  start(ttlSeconds: number | undefined) {
    this.stop();
    if (ttlSeconds === undefined) {
      return;
    }
    if (ttlSeconds <= 0) {
      this.elapsed = true;
      return;
    }
    this.remainingMs = ttlSeconds * 1000;
    this.scheduleNextChunk();
  }

  hasElapsed() {
    return this.elapsed;
  }

  stop() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.remainingMs = 0;
    this.elapsed = false;
  }

  private scheduleNextChunk() {
    const delay = Math.min(this.remainingMs, MAX_TIMEOUT_MS);
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.remainingMs -= delay;
      if (this.remainingMs > 0) {
        this.scheduleNextChunk();
        return;
      }
      this.elapsed = true;
      this.onElapsed();
    }, delay);
  }
}
