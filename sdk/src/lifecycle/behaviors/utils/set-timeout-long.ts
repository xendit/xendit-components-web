// wait in 5-minute chunks, setTimeout can't wait longer than ~24.8 days
const CHUNK_MS = 300_000;

/**
 * setTimeout for delays of any length. Calls back once the clock reaches the deadline.
 * Returns a function that cancels it.
 */
export function setTimeoutLong(callback: () => void, ms: number): () => void {
  const deadline = Date.now() + ms;
  let timeout: ReturnType<typeof setTimeout>;
  const check = () => {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      callback();
      return;
    }
    timeout = setTimeout(check, Math.min(remainingMs, CHUNK_MS));
  };
  timeout = setTimeout(check, Math.min(ms, CHUNK_MS));
  return () => clearTimeout(timeout);
}
