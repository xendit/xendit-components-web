import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XenditComponents } from "../src";
import type { BffPollResponse, BffResponse } from "../src/backend-types/common";
import { makeTestBffData } from "../src/data/test-data";
import { makeTestSdkKey } from "../src/data/test-data-modifiers";
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

function stubResumeLocation() {
  vi.stubGlobal("location", {
    ...window.location,
    search: RESUME_SEARCH,
  });
}

/**
 * A poll response with a changed session status and no payment entity.
 * Without a payment_request/payment_token, resolveResumeState() returns
 * null, so the only way the new status reaches the world state is the
 * "update world state after first poll on resume" branch.
 */
function makePollResponseSessionOnly(
  bff: BffResponse,
  status: "EXPIRED" | "COMPLETED" | "CANCELED",
): BffPollResponse {
  return {
    session: { ...bff.session, status },
  };
}

describe("sdk resume world state reflects session status change after first poll", () => {
  beforeEach(() => {
    stubResumeLocation();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(fetchSessionData).mockReset();
    vi.mocked(pollSession).mockReset();
  });

  it("updates getSession() to EXPIRED and fires session-expired-or-canceled when the poll shows an expired session with no payment entity", async () => {
    const bff = makeTestBffData();
    vi.mocked(fetchSessionData).mockResolvedValue(bff);
    vi.mocked(pollSession).mockResolvedValue(
      makePollResponseSessionOnly(bff, "EXPIRED"),
    );

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });

    const events = watchEvents(sdk, [
      "init",
      "session-expired-or-canceled",
      "session-complete",
    ]);

    await waitForEvent(sdk, "init");

    expect(vi.mocked(pollSession)).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "resume-123",
    );

    expect(sdk.getSession().status).toBe("EXPIRED");

    expect(findEvent(events, "session-expired-or-canceled")).toBeDefined();
    expect(findEvent(events, "session-complete")).toBeUndefined();
  });

  it("updates getSession() to COMPLETED and fires session-complete when the poll shows a completed session", async () => {
    const bff = makeTestBffData();
    vi.mocked(fetchSessionData).mockResolvedValue(bff);
    vi.mocked(pollSession).mockResolvedValue(
      makePollResponseSessionOnly(bff, "COMPLETED"),
    );

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });

    const events = watchEvents(sdk, [
      "init",
      "session-complete",
      "session-expired-or-canceled",
    ]);

    await waitForEvent(sdk, "init");

    expect(sdk.getSession().status).toBe("COMPLETED");

    expect(findEvent(events, "session-complete")).toBeDefined();
    expect(findEvent(events, "session-expired-or-canceled")).toBeUndefined();
  });

  it("keeps the session ACTIVE when the poll status is unchanged", async () => {
    const bff = makeTestBffData();
    vi.mocked(fetchSessionData).mockResolvedValue(bff);
    vi.mocked(pollSession).mockResolvedValue({
      session: { ...bff.session, status: "ACTIVE" },
    });

    const sdk = new XenditComponents({
      componentsSdkKey: makeTestSdkKey(),
      resume: true,
    });

    await waitForEvent(sdk, "init");

    expect(sdk.getSession().status).toBe("ACTIVE");
  });
});
