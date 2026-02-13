import { describe, expect, it } from "vitest";
import { behaviorTreeForSdk, BlackboardType } from "./behavior-tree";
import { parseSdkKey } from "../utils";
import { makeTestBffData } from "../data/test-data";
import {
  SdkActiveBehavior,
  SdkFatalErrorBehavior,
  SdkLoadingBehavior,
} from "./behaviors/sdk";
import {
  SessionActiveBehavior,
  SessionCompletedBehavior,
  SessionFailedBehavior,
} from "./behaviors/session";
import { BffSessionStatus } from "../backend-types/session";
import { BehaviorNode } from "./behavior-tree-runner";
import { BffChannel } from "../backend-types/channel";
import {
  ChannelInvalidBehavior,
  ChannelValidBehavior,
} from "./behaviors/channel";
import { CardInfoBehavior } from "./behaviors/card-info";
import { SubmissionBehavior } from "./behaviors/submission";
import { toPaymentEntity } from "../backend-types/payment-entity";
import { randomUUID } from "node:crypto";
import {
  PeFailedBehavior,
  PePendingBehavior,
  PeRequiresActionBehavior,
} from "./behaviors/payment-entity";
import {
  ActionCompletedBehavior,
  ActionIframeBehavior,
} from "./behaviors/action";
import { SimulatePaymentBehavior } from "./behaviors/simulate-payment";
import {
  makeTestPaymentRequest,
  makeTestSdkKey,
  withPaymentEntityStatus,
} from "../data/test-data-modifiers";

const testData = makeTestBffData();

const mockBlackboard: BlackboardType & { world: object } = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdk: {} as any,
  mock: true,
  sdkKey: parseSdkKey(makeTestSdkKey()),
  world: {
    business: testData.business,
    customer: testData.customer,
    session: testData.session,
    channels: testData.channels,
    channelUiGroups: testData.channel_ui_groups,
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
    cardDetails: null,
    paymentOptions: null,
  },
  dispatchEvent: () => {
    throw new Error("Should not be called in this test");
  },
  submissionRequested: false,
  simulatePaymentRequested: false,
  actionCompleted: false,
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
  let cursor = node;
  let i = 0;
  while (true) {
    expect(i).toBeLessThan(nodes.length);
    expect(cursor.impl).toBe(nodes[i]);
    i += 1;
    if (cursor.child) {
      cursor = cursor.child;
    } else {
      break;
    }
  }
  expect(i).toBe(nodes.length);
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
      CardInfoBehavior,
      ChannelInvalidBehavior,
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
      PePendingBehavior,
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
      PeFailedBehavior,
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
      PeRequiresActionBehavior,
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
      PeRequiresActionBehavior,
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
      PeRequiresActionBehavior,
      ActionIframeBehavior,
    ]);
  });
});
