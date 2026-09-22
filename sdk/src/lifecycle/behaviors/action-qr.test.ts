import { beforeEach, describe, expect, it, vi } from "vitest";
import { pollSession } from "../../api";
import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentRequest } from "../../backend-types/payment-entity";
import { makeTestBffData } from "../../data/test-data";
import {
  makeTestPaymentRequest,
  makeTestSdkKey,
} from "../../data/test-data-modifiers";
import { internal } from "../../internal";
import { InternalUpdateWorldState } from "../../private-event-types";
import { parseSdkKey } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ActionQrBehavior } from "./action-qr";

// Keep the real module, only replace the network call checkStatus makes.
vi.mock("../../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../api")>()),
  pollSession: vi.fn(),
}));

const session = makeTestBffData().session;

function buildBlackboard(events: Event[]): BlackboardType {
  return {
    sdk: {
      [internal]: { liveComponents: { actionInstructionsContainer: null } },
    },
    sdkKey: parseSdkKey(makeTestSdkKey()),
    world: { sessionTokenRequestId: "tok-1" },
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function paymentRequest(
  status: BffPaymentRequest["status"],
): BffPaymentRequest {
  return { ...makeTestPaymentRequest("QRIS", "PENDING"), status };
}

beforeEach(() => {
  vi.mocked(pollSession).mockReset();
});

describe("ActionQrBehavior.checkStatus", () => {
  it("resolves false while the payment still requires action", async () => {
    vi.mocked(pollSession).mockResolvedValue({
      session,
      payment_request: paymentRequest("REQUIRES_ACTION"),
    });
    const events: Event[] = [];
    const behavior = new ActionQrBehavior(buildBlackboard(events), "0");

    await expect(behavior.checkStatus()).resolves.toBe(false);
    expect(pollSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      "tok-1",
    );
    expect(events.some((e) => e.type === InternalUpdateWorldState.type)).toBe(
      true,
    );
  });

  it("resolves true once the payment has succeeded", async () => {
    vi.mocked(pollSession).mockResolvedValue({
      session,
      payment_request: paymentRequest("SUCCEEDED"),
    });
    const behavior = new ActionQrBehavior(buildBlackboard([]), "0");

    await expect(behavior.checkStatus()).resolves.toBe(true);
  });

  it("resolves true once the session is completed", async () => {
    vi.mocked(pollSession).mockResolvedValue({
      session: { ...session, status: "COMPLETED" },
    });
    const behavior = new ActionQrBehavior(buildBlackboard([]), "0");

    await expect(behavior.checkStatus()).resolves.toBe(true);
  });

  it("ignores a response that arrives after the behavior has exited", async () => {
    let respond: (response: BffPollResponse) => void = () => {};
    vi.mocked(pollSession).mockReturnValue(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );
    const events: Event[] = [];
    const behavior = new ActionQrBehavior(buildBlackboard(events), "0");

    // the stream closes the screen while the poll is still in flight
    const result = behavior.checkStatus();
    behavior.exit();
    respond({ session, payment_request: paymentRequest("REQUIRES_ACTION") });

    await expect(result).resolves.toBe(true);
    expect(events.some((e) => e.type === InternalUpdateWorldState.type)).toBe(
      false,
    );
  });
});
