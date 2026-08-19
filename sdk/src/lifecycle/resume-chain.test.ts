import { describe, expect, it } from "vitest";
import { BehaviorTree } from "./behavior-tree-runner";
import { behaviorTreeForSdk, BlackboardType } from "./behavior-tree";
import { InternalBehaviorTreeUpdateEvent } from "../private-event-types";
import { XenditSubmissionEndEvent } from "../public-event-types";
import { parseSdkKey, sleep } from "../utils";
import { makeTestBffData } from "../data/test-data";
import {
  makeTestPaymentRequest,
  makeTestSdkKey,
  withPaymentEntityStatus,
} from "../data/test-data-modifiers";
import { toPaymentEntity } from "../backend-types/payment-entity";
import { internal } from "../internal";
import { MockSdk } from "../utils-test";

/**
 * Builds a blackboard that mimics the state the SDK restores on resume after a
 * failed redirect payment: resuming=true with a FAILED payment entity already
 * populated (and no selected channel, because the page was reloaded).
 */
function buildBlackboard(
  events: Event[],
  getTree: () => BehaviorTree<BlackboardType>,
): BlackboardType {
  const testData = makeTestBffData();
  const dispatchEvent = (event: Event) => {
    events.push(event);
    if (event.type === InternalBehaviorTreeUpdateEvent.type) {
      getTree().update();
    }
    return true;
  };

  const mockSdk = new MockSdk({
    componentsSdkKey: makeTestSdkKey(),
  });

  return {
    sdk: mockSdk,
    telemetry: mockSdk[internal].telemetry,
    mock: true,
    sdkKey: parseSdkKey(makeTestSdkKey()),
    world: {
      business: testData.business,
      customer: testData.customer,
      session: testData.session, // ACTIVE
      channels: testData.channels,
      channelUiGroups: testData.channel_ui_groups,
      digitalWallets: testData.digital_wallets ?? null,
      paymentEntity: toPaymentEntity(
        withPaymentEntityStatus(
          makeTestPaymentRequest("MOCK_QR", undefined),
          "FAILED",
        ),
      ),
      sessionTokenRequestId: "resume-token-id",
      succeededChannel: null,
    },
    sdkStatus: "ACTIVE",
    sdkFatalErrorMessage: null,
    channel: null,
    channelProperties: null,
    channelData: null,
    channelIsDigitalWallet: false,
    instantSubmissionError: null,
    dispatchEvent,
    submissionRequested: false,
    resuming: true,
    simulatePaymentRequested: false,
    actionCompleted: false,
    redirectReturnPending: false,
    pollImmediatelyRequested: false,
  } as BlackboardType;
}

describe("resume error chain (integration)", () => {
  it("emits submission-resume then submission-end with a userErrorMessage when restored state is FAILED", async () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events, () => tree);
    const tree = new BehaviorTree<BlackboardType>(behaviorTreeForSdk, bb);

    tree.update();

    const resumeEvent = events.find((e) => e.type === "submission-resume");
    expect(resumeEvent).toBeDefined();

    const endEvent = events.find(
      (e): e is XenditSubmissionEndEvent =>
        e.type === XenditSubmissionEndEvent.type,
    );
    expect(endEvent).toBeDefined();
    expect(endEvent?.userErrorMessage).toBeDefined();
    expect((endEvent?.userErrorMessage ?? []).length).toBeGreaterThan(0);

    await sleep(10000);
  });
});
