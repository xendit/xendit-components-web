import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionError, fetchWithRetry } from "./networking";

const TEST_URL = new URL("https://gateway.example.test/api/sessions/abc");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("networking - fetchWithRetry", () => {
  it("converts a fetch TypeError into a ConnectionError and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithRetry(TEST_URL, { method: "GET" }, 500, 3);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws the last ConnectionError once all attempts are exhausted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      fetchWithRetry(TEST_URL, { method: "GET" }, 500, 3),
    ).rejects.toThrow(ConnectionError);
  });

  it("passes an AbortError through immediately without retrying", async () => {
    const abortError = new DOMException(
      "The operation was aborted",
      "AbortError",
    );
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry(TEST_URL, { method: "GET" }, 500, 3),
    ).rejects.toBe(abortError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a non-ok response unchanged instead of treating it as a connection failure", async () => {
    const response = new Response('{"error_code":"INVALID_KEY"}', {
      status: 401,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const result = await fetchWithRetry(TEST_URL, { method: "GET" }, 500, 1);

    expect(result).toBe(response);
    expect(result.ok).toBe(false);
  });

  it("succeeds on the first attempt without retrying", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithRetry(TEST_URL, { method: "GET" }, 500, 3);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
