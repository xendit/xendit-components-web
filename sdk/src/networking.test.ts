import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry, NetworkError, openEventStream } from "./networking";

const TEST_URL = new URL("https://gateway.example.test/api/sessions/abc");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("networking - fetchWithRetry", () => {
  it("retries when the browser couldn't reach the server", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithRetry(TEST_URL, { method: "GET" }, 500, 3);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws the last error once all attempts are exhausted", async () => {
    const lastError = new TypeError("Failed to fetch");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(lastError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry(TEST_URL, { method: "GET" }, 500, 3),
    ).rejects.toBe(lastError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

function eventStreamResponse(text: string, contentType = "text/event-stream") {
  const body = new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType },
  });
}

describe("networking - openEventStream", () => {
  it("returns a reader for the event stream body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(eventStreamResponse("event: update\n")),
    );

    const reader = await openEventStream(
      TEST_URL,
      new AbortController().signal,
    );
    const { value } = await reader.read();

    expect(new TextDecoder().decode(value)).toBe("event: update\n");
  });

  it("asks for an event stream and passes the abort signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(eventStreamResponse(""));
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    await openEventStream(TEST_URL, signal);

    expect(fetchMock).toHaveBeenCalledWith(TEST_URL, {
      method: "GET",
      headers: { Accept: "text/event-stream" },
      signal,
    });
  });

  it("throws a NetworkError for an error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            '{"error_code":"SESSION_NOT_FOUND","message":"not found"}',
            { status: 404 },
          ),
        ),
    );

    const error = await openEventStream(
      TEST_URL,
      new AbortController().signal,
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NetworkError);
    expect((error as NetworkError).errorResponse.error_code).toBe(
      "SESSION_NOT_FOUND",
    );
  });

  it("throws when the response is not an event stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(eventStreamResponse("<html>", "text/html")),
    );

    await expect(
      openEventStream(TEST_URL, new AbortController().signal),
    ).rejects.toThrow("Unexpected content type from event stream");
  });

  it("throws when the response has no body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }),
      ),
    );

    await expect(
      openEventStream(TEST_URL, new AbortController().signal),
    ).rejects.toThrow("Event stream response has no body");
  });
});
