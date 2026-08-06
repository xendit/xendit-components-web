import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionError, fetchOrThrowConnectionError } from "./networking";

const TEST_URL = new URL("https://gateway.example.test/api/sessions/abc");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("networking - fetchOrThrowConnectionError", () => {
  it("converts a fetch TypeError into a ConnectionError, preserving the message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      fetchOrThrowConnectionError(TEST_URL, { method: "GET" }),
    ).rejects.toThrow(ConnectionError);

    await expect(
      fetchOrThrowConnectionError(TEST_URL, { method: "GET" }),
    ).rejects.toThrow("Failed to fetch");
  });

  it("passes an AbortError through unchanged", async () => {
    const abortError = new DOMException(
      "The operation was aborted",
      "AbortError",
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(
      fetchOrThrowConnectionError(TEST_URL, { method: "GET" }),
    ).rejects.toBe(abortError);
  });

  it("passes a non-TypeError rejection through unchanged", async () => {
    const bug = new Error("Unknown hostId in sdkKey");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(bug));

    await expect(
      fetchOrThrowConnectionError(TEST_URL, { method: "GET" }),
    ).rejects.toBe(bug);
  });

  it("returns an error response unchanged instead of treating it as a connection failure", async () => {
    const response = new Response('{"error_code":"INVALID_KEY"}', {
      status: 401,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const result = await fetchOrThrowConnectionError(TEST_URL, {
      method: "GET",
    });

    expect(result).toBe(response);
    expect(result.ok).toBe(false);
  });
});
