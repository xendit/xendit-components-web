import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponents } from "../src";
import { makeTestBffData } from "../src/data/test-data";
import {
  makeTestPaymentRequest,
  makeTestSdkKey,
  withPaymentEntityStatus,
} from "../src/data/test-data-modifiers";
import { getTelemetry } from "../src/telemetry";
import { findEvent, waitForEvent, watchEvents } from "./utils";

vi.mock("../src/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/api")>();
  return {
    ...actual,
    fetchSessionData: vi.fn(),
    pollSession: vi.fn(),
  };
});

// Imported after the mock so we get the mocked versions.
import { fetchSessionData, pollSession } from "../src/api";

const RESUME_SEARCH = "?token_request_id=resume-123";

function stubLocationSearch(search: string) {
  vi.stubGlobal("location", {
    ...window.location,
    search,
  });
}

/**
 * Removes every queued telemetry event and returns their stage and success.
 */
function drainTelemetry(sdk: XenditComponents) {
  const telemetry = getTelemetry(sdk);
  const events: Array<{ stage: string; success: boolean }> = [];
  let next = telemetry.testGetNextEvent();
  while (next) {
    events.push({ stage: next.stage, success: next.success });
    next = telemetry.testGetNextEvent();
  }
  return events;
}

describe("sdk resume initialization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(fetchSessionData).mockReset();
    vi.mocked(pollSession).mockReset();
  });

  it("resumes from the session response without calling the poll endpoint", async () => {
    stubLocationSearch(RESUME_SEARCH);
    vi.mocked(fetchSessionData).mockResolvedValue({
      ...makeTestBffData(),
      payment_request: withPaymentEntityStatus(
        makeTestPaymentRequest("MOCK_QR", undefined),
        "FAILED",
      ),
    });

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });

    await Promise.all([
      waitForEvent(sdk, "init"),
      waitForEvent(sdk, "submission-resume"),
    ]);

    expect(vi.mocked(fetchSessionData)).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { tokenRequestId: "resume-123" },
    );
    expect(vi.mocked(pollSession)).not.toHaveBeenCalled();
    expect(drainTelemetry(sdk)).toContainEqual({
      stage: "CHECKOUT_RESUME",
      success: true,
    });
  });

  it("applies an expired session from the session response", async () => {
    stubLocationSearch(RESUME_SEARCH);
    const bff = makeTestBffData();
    vi.mocked(fetchSessionData).mockResolvedValue({
      ...bff,
      session: { ...bff.session, status: "EXPIRED" },
    });

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });
    const events = watchEvents(sdk, [
      "session-expired-or-canceled",
      "session-complete",
    ]);

    await waitForEvent(sdk, "init");

    expect(sdk.getSession().status).toBe("EXPIRED");
    expect(findEvent(events, "session-expired-or-canceled")).toBeDefined();
    expect(findEvent(events, "session-complete")).toBeUndefined();
  });

  it("applies a completed session without a payment entity from the session response", async () => {
    stubLocationSearch(RESUME_SEARCH);
    const bff = makeTestBffData();
    vi.mocked(fetchSessionData).mockResolvedValue({
      ...bff,
      session: { ...bff.session, status: "COMPLETED" },
    });

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });
    const events = watchEvents(sdk, [
      "session-complete",
      "session-expired-or-canceled",
    ]);

    await waitForEvent(sdk, "init");

    expect(sdk.getSession().status).toBe("COMPLETED");
    expect(findEvent(events, "session-complete")).toBeDefined();
    expect(findEvent(events, "session-expired-or-canceled")).toBeUndefined();
  });

  it("reports CHECKOUT_RESUME failure when the session fetch fails while resuming", async () => {
    stubLocationSearch(RESUME_SEARCH);
    vi.mocked(fetchSessionData).mockRejectedValue(
      new Error("PAYMENT_REQUEST_NOT_FOUND"),
    );

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });

    await waitForEvent(sdk, "fatal-error");

    const telemetry = drainTelemetry(sdk);
    expect(telemetry).toContainEqual({
      stage: "CHECKOUT_RESUME",
      success: false,
    });
    expect(telemetry).not.toContainEqual(
      expect.objectContaining({ stage: "CHECKOUT_LOADED" }),
    );
  });

  it("fails without fetching the session when token_request_id is missing", async () => {
    stubLocationSearch("?foo=bar");

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });

    await waitForEvent(sdk, "fatal-error");

    expect(vi.mocked(fetchSessionData)).not.toHaveBeenCalled();
    expect(drainTelemetry(sdk)).toContainEqual({
      stage: "CHECKOUT_RESUME",
      success: false,
    });
  });
});
