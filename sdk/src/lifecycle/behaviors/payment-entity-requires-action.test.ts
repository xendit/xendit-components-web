import { describe, expect, it } from "vitest";
import { PaymentEntityRequiresActionBehavior } from "./payment-entity-requires-action";
import { BlackboardType } from "../behavior-tree";
import { BffPollResponse } from "../../backend-types/common";
import { InternalUpdateWorldState } from "../../private-event-types";
import { parseSdkKey } from "../../utils";
import { makeTestBffData } from "../../data/test-data";
import {
  makeTestPaymentRequest,
  makeTestSdkKey,
  withPaymentEntityStatus,
} from "../../data/test-data-modifiers";
import {
  BffPaymentEntity,
  BffPaymentRequestStatus,
  toPaymentEntity,
} from "../../backend-types/payment-entity";

const testData = makeTestBffData();
const pollResponse: BffPollResponse = { session: testData.session };

function buildBlackboard(
  events: Event[],
  overrides: Partial<BlackboardType>,
): BlackboardType {
  return {
    sdk: { isMock: () => true },
    mock: true,
    sdkKey: parseSdkKey(makeTestSdkKey()),
    world: {
      business: testData.business,
      customer: testData.customer,
      session: testData.session,
      channels: testData.channels,
      channelUiGroups: testData.channel_ui_groups,
      digitalWallets: testData.digital_wallets ?? null,
      paymentEntity: null,
      sessionTokenRequestId: "tok-1",
      succeededChannel: null,
    },
    sdkStatus: "ACTIVE",
    sdkFatalErrorMessage: null,
    sdkFatalErrorUserMessage: null,
    channel: null,
    channelProperties: null,
    channelData: null,
    channelIsDigitalWallet: false,
    instantSubmissionError: null,
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    submissionRequested: true,
    resuming: false,
    simulatePaymentRequested: false,
    actionCompleted: false,
    redirectReturnPending: false,
    pollImmediatelyRequested: false,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function entityWithStatus(status: BffPaymentRequestStatus): BffPaymentEntity {
  return toPaymentEntity(
    withPaymentEntityStatus(
      makeTestPaymentRequest("MOCK_REDIRECT", "REDIRECT"),
      status,
    ),
  );
}

describe("PaymentEntityRequiresActionBehavior.onPollResult", () => {
  it("cancels the submission when a redirect return finds the payment still REQUIRES_ACTION", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, { redirectReturnPending: true });
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.onPollResult(pollResponse, entityWithStatus("REQUIRES_ACTION"));

    expect(bb.submissionRequested).toBe(false);
    expect(bb.resuming).toBe(false);
    expect(bb.redirectReturnPending).toBe(false);
  });

  it("raises the cancel flags before dispatching, so a single tree update lands on the final state", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, { redirectReturnPending: true });
    let submissionRequestedAtDispatch: boolean | null = null;
    bb.dispatchEvent = (event: Event) => {
      submissionRequestedAtDispatch = bb.submissionRequested;
      events.push(event);
      return true;
    };
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.onPollResult(pollResponse, entityWithStatus("REQUIRES_ACTION"));

    expect(submissionRequestedAtDispatch).toBe(false);
  });

  it("does not cancel a routine poll, which is also REQUIRES_ACTION before the buyer leaves", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, { redirectReturnPending: false });
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.onPollResult(pollResponse, entityWithStatus("REQUIRES_ACTION"));

    expect(bb.submissionRequested).toBe(true);
  });

  it("does not cancel when the payment has already settled", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, { redirectReturnPending: true });
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.onPollResult(pollResponse, entityWithStatus("SUCCEEDED"));

    expect(bb.submissionRequested).toBe(true);
    expect(bb.redirectReturnPending).toBe(false);
  });

  it("keeps the flag when a poll carries no payment entity, so the next poll can still decide", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, { redirectReturnPending: true });
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.onPollResult(pollResponse, null);

    expect(bb.redirectReturnPending).toBe(true);
    expect(bb.submissionRequested).toBe(true);
  });

  it("always dispatches the world state update", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, { redirectReturnPending: true });
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.onPollResult(pollResponse, entityWithStatus("REQUIRES_ACTION"));

    expect(events.some((e) => e.type === InternalUpdateWorldState.type)).toBe(
      true,
    );
  });
});

describe("PaymentEntityRequiresActionBehavior.exit", () => {
  it("clears redirectReturnPending along with actionCompleted", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, {
      redirectReturnPending: true,
      actionCompleted: true,
    });
    const behavior = new PaymentEntityRequiresActionBehavior(bb);

    behavior.exit();

    expect(bb.actionCompleted).toBe(false);
    expect(bb.redirectReturnPending).toBe(false);
  });
});
