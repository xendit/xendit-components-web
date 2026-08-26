import { describe, expect, it } from "vitest";
import { behaviorTreeForSdk, BlackboardType } from "./behavior-tree";
import { parseSdkKey } from "../utils";
import { makeTestBffData } from "../data/test-data";
import { BffSessionStatus } from "../backend-types/session";
import { BehaviorNode, flattenBehaviors } from "./behavior-tree-runner";
import { BffChannel } from "../backend-types/channel";
import { CardInfoBehavior } from "./behaviors/card-info";
import { SubmissionBehavior } from "./behaviors/submission";
import { toPaymentEntity } from "../backend-types/payment-entity";
import { randomUUID } from "node:crypto";
import { SimulatePaymentBehavior } from "./behaviors/simulate-payment";
import {
  makeTestPaymentRequest,
  makeTestSdkKey,
  withPaymentEntityStatus,
} from "../data/test-data-modifiers";
import { PaymentOptionsBehavior } from "./behaviors/payment-options";
import { internal } from "../internal";
import { ActionPaylinkBehavior } from "./behaviors/action-paylink";
import { SdkActiveBehavior } from "./behaviors/sdk-active";
import { SessionCompletedBehavior } from "./behaviors/session-completed";
import { SdkFatalErrorBehavior } from "./behaviors/sdk-fatal-error";
import { SdkLoadingBehavior } from "./behaviors/sdk-loading";
import { SessionFailedBehavior } from "./behaviors/session-failed";
import { SessionActiveBehavior } from "./behaviors/session-active";
import { ChannelValidBehavior } from "./behaviors/channel-valid";
import { ChannelInvalidBehavior } from "./behaviors/channel-invalid";
import { PaymentEntityRequiresActionBehavior } from "./behaviors/payment-entity-requires-action";
import { ActionCompletedBehavior } from "./behaviors/action-completed";
import { ActionQrBehavior } from "./behaviors/action-qr";
import { ActionIframeBehavior } from "./behaviors/action-iframe";
import { ActionDeepLinkBehavior } from "./behaviors/action-deep-link";
import { ActionBarcodeBehavior } from "./behaviors/action-barcode";
import { PaymentEntityFailedBehavior } from "./behaviors/payment-entity-failed";
import { PaymentEntityPendingBehavior } from "./behaviors/payment-entity-pending";
import { MockSdk } from "../utils-test";

const testData = makeTestBffData();

const mockSdk = new MockSdk({
  componentsSdkKey: makeTestSdkKey(),
  enablePaylinks: true,
});

const mockBlackboard: BlackboardType & { world: object } = {
  sdk: mockSdk,
  telemetry: mockSdk[internal].telemetry,
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
    sessionTokenRequestId: null,
    succeededChannel: null,
  },
  sdkStatus: "ACTIVE",
  sdkFatalErrorMessage: null,
  channel: null,
  channelProperties: null,
  channelData: {
    savePaymentMethod: false,
    cardBin: null,
    cardDetails: null,
    paymentOptions: null,
    customerDetails: null,
  },
  channelIsDigitalWallet: false,
  instantSubmissionError: null,
  dispatchEvent: () => {
    throw new Error("Should not be called in this test");
  },
  submissionRequested: false,
  resuming: false,
  simulatePaymentRequested: false,
  actionCompleted: false,
  redirectReturnPending: false,
  pollImmediatelyRequested: false,
};

function withSessionStatus(
  bb: BlackboardType & { world: object },
  status: BffSessionStatus,
) {
  return {
    ...bb,
    world: {
      ...bb.world,
      session: {
        ...bb.world.session,
        status,
      },
    },
  };
}

function findChannel(channels: BffChannel[], channelCode: string) {
  const ch = channels.find((c) => c.channel_code === channelCode);
  if (!ch) {
    throw new Error(`Channel not found: ${channelCode}`);
  }
  return ch;
}

function assertHasNodes(node: BehaviorNode<BlackboardType>, nodes: unknown[]) {
  const flattened = flattenBehaviors(node);
  expect(flattened.length).toBe(nodes.length);
  for (let i = 0; i < nodes.length; i++) {
    expect(flattened[i].impl).toBe(nodes[i]);
  }
}

describe("Behavior Tree - SDK states", () => {
  it("should give loading behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      sdkStatus: "LOADING",
    });
    assertHasNodes(node, [SdkLoadingBehavior]);
  });
  it("should give fatal error behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      sdkStatus: "FATAL_ERROR",
    });
    assertHasNodes(node, [SdkFatalErrorBehavior]);
  });
});

describe("Behavior Tree - Session States", () => {
  it("should give completed behavior", () => {
    const node = behaviorTreeForSdk(
      withSessionStatus(mockBlackboard, "COMPLETED"),
    );
    assertHasNodes(node, [SdkActiveBehavior, SessionCompletedBehavior]);
  });
  it("should give failed behavior (expired)", () => {
    const node = behaviorTreeForSdk(
      withSessionStatus(mockBlackboard, "EXPIRED"),
    );
    assertHasNodes(node, [SdkActiveBehavior, SessionFailedBehavior]);
  });
  it("should give failed behavior (canceled)", () => {
    const node = behaviorTreeForSdk(
      withSessionStatus(mockBlackboard, "CANCELED"),
    );
    assertHasNodes(node, [SdkActiveBehavior, SessionFailedBehavior]);
  });
});

describe("Behavior Tree - Form validity and card info", () => {
  it("should give form valid behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      ChannelValidBehavior,
    ]);
  });
  it("should give invalid form behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(
        mockBlackboard.world.channels,
        "MOCK_EWALLET_WITH_PHONE",
      ),
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      ChannelInvalidBehavior,
    ]);
  });
  it("should give card info behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "CARDS"),
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      ChannelInvalidBehavior,
      CardInfoBehavior,
      PaymentOptionsBehavior,
    ]);
  });
});

describe("Behavior Tree - Submission", () => {
  it("should give submission behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
    ]);
  });
});

describe("Behavior Tree - Payment Entity", () => {
  it("should give paymentEntity pending behavior (success / active / authorized)", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          withPaymentEntityStatus(
            makeTestPaymentRequest("MOCK_QR", undefined),
            "SUCCEEDED",
          ),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityPendingBehavior,
    ]);
  });
  it("should give paymentEntity failed behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          withPaymentEntityStatus(
            makeTestPaymentRequest("MOCK_QR", undefined),
            "FAILED",
          ),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityFailedBehavior,
    ]);
  });
  it("should give paymentEntity pending behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          withPaymentEntityStatus(
            makeTestPaymentRequest("MOCK_QR", undefined),
            "PENDING",
          ),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityPendingBehavior,
    ]);
  });
});

describe("Behavior Tree - Actions (edge cases)", () => {
  it("should give action completed behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
      actionCompleted: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          makeTestPaymentRequest("MOCK_QR", "IFRAME"),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityRequiresActionBehavior,
      ActionCompletedBehavior,
    ]);
  });
  it("should give simulate payment behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
      simulatePaymentRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(makeTestPaymentRequest("MOCK_QR", "QR")),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityRequiresActionBehavior,
      ActionQrBehavior,
      SimulatePaymentBehavior,
    ]);
  });
});

describe("Behavior Tree - Actions", () => {
  it("should give iframe behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_QR"),
      submissionRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          makeTestPaymentRequest("MOCK_QR", "IFRAME"),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityRequiresActionBehavior,
      ActionIframeBehavior,
    ]);
  });

  it("should give redirect and paylink actions", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(
        mockBlackboard.world.channels,
        "MOCK_EWALLET_PAYLINK",
      ),
      submissionRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          makeTestPaymentRequest("MOCK_EWALLET_PAYLINK", [
            "REDIRECT",
            "PAYLINK",
          ]),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityRequiresActionBehavior,
      ActionDeepLinkBehavior,
      ActionPaylinkBehavior,
    ]);
  });

  it("should give barcode behavior", () => {
    const node = behaviorTreeForSdk({
      ...mockBlackboard,
      channel: findChannel(mockBlackboard.world.channels, "MOCK_OTC"),
      submissionRequested: true,
      world: {
        ...mockBlackboard.world,
        paymentEntity: toPaymentEntity(
          makeTestPaymentRequest("MOCK_OTC", "BARCODE"),
        ),
        sessionTokenRequestId: randomUUID(),
      },
    });
    assertHasNodes(node, [
      SdkActiveBehavior,
      SessionActiveBehavior,
      SubmissionBehavior,
      PaymentEntityRequiresActionBehavior,
      ActionBarcodeBehavior,
    ]);
  });
});
