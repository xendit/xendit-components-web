import { amountFormat } from "../amount-format";
import { BffChannel, MockActionType } from "../backend-types/channel";
import { BffPollResponse } from "../backend-types/common";
import {
  BffAction,
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequest,
  BffPaymentRequestStatus,
  BffPaymentToken,
  BffPaymentTokenStatus,
} from "../backend-types/payment-entity";
import { BffPaymentOptions } from "../backend-types/payment-options";
import { BffSession } from "../backend-types/session";
import { WorldState } from "../public-sdk";
import { assert, randomHexString, randomUUID } from "../utils";

const examplePublicKey =
  "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEyCADI5pdf6KmN8+Fxl2ES3yolUKXunNeY3gGScGNEvDcrcHAPKxIInAo5DVnDvTtYtqZvx/bu7HLeBJNMXwHhie/uyNEtT8dSaLc9bd0WSlYdxI+iUsTv2Qu0LiiPrZs";
const exampleSignature =
  "NKf7whM9meUs/eRCvG0oc180MDiyeli3kH6EQ3ZahECHsZQi5G2IpH6vk3cYMtf01Y1L4OBn1SZCOv1kwpjIUet4DJeoTwwq2nM5b+K7rD+/WFTi3AEX4NWJNkKi0a91";

export function makeTestSdkKey() {
  return `session-${randomHexString(32)}-mock-${examplePublicKey}-${exampleSignature}`;
}

export function makeTestPollResponse(
  world: WorldState,
  channel: BffChannel | null,
  success: boolean,
) {
  const { session, paymentEntity } = world;
  assert(session);
  assert(paymentEntity);
  assert(channel);

  if (channel._mock_action_type === "PENDING") {
    // channels requesting mock pending state
    return makeTestPollResponseForPending(session);
  } else if (success) {
    return makeTestPollResponseForSuccess(session, paymentEntity);
  } else {
    return makeTestPollResponseForFailure(session, paymentEntity);
  }
}

export function makeTestPollResponseForPending(
  session: BffSession,
): BffPollResponse {
  return {
    session: {
      ...session,
      status: "PENDING",
    },
  };
}

export function makeTestPollResponseForSuccess(
  session: BffSession,
  paymentEntity: BffPaymentEntity,
): BffPollResponse {
  const paymentRequest =
    paymentEntity.type === BffPaymentEntityType.PaymentRequest
      ? paymentEntity.entity
      : undefined;
  const paymentToken =
    paymentEntity.type === BffPaymentEntityType.PaymentToken
      ? paymentEntity.entity
      : undefined;

  return {
    session: {
      ...session,
      status: "COMPLETED",
      payment_request_id: paymentRequest?.payment_request_id,
      payment_token_id: paymentToken?.payment_token_id,
    },
    payment_request: withPaymentEntityStatus(paymentRequest, "SUCCEEDED"),
    payment_token: withPaymentEntityStatus(paymentToken, "ACTIVE"),
    succeeded_channel: {
      channel_code: paymentEntity.entity.channel_code,
      logo_url: "https://placehold.co/48",
    },
  };
}

export function makeTestPollResponseForFailure(
  session: BffSession,
  paymentEntity: BffPaymentEntity,
): BffPollResponse {
  const paymentRequest =
    paymentEntity.type === BffPaymentEntityType.PaymentRequest
      ? paymentEntity.entity
      : undefined;
  const paymentToken =
    paymentEntity.type === BffPaymentEntityType.PaymentToken
      ? paymentEntity.entity
      : undefined;

  return {
    session: {
      ...session,
      status: "ACTIVE",
    },
    payment_request: withPaymentEntityStatus(paymentRequest, "FAILED"),
    payment_token: withPaymentEntityStatus(paymentToken, "FAILED"),
  };
}

export function withPaymentEntityStatus<
  T extends BffPaymentRequest | BffPaymentToken | undefined,
>(
  prOrPt: T,
  status: T extends BffPaymentRequest
    ? BffPaymentRequestStatus
    : T extends BffPaymentToken
      ? BffPaymentTokenStatus
      : undefined,
): T {
  if (!prOrPt) return prOrPt;
  return {
    ...prOrPt,
    status: status,
  };
}

export function makeTestPaymentRequest(
  channelCode: string,
  mockActionType: MockActionType | undefined,
): BffPaymentRequest {
  if (mockActionType === "PENDING") {
    return {
      payment_request_id: `pr-${randomUUID()}`,
      status: "PENDING",
      channel_code: channelCode,
      actions: [],
      session_token_request_id: randomUUID(),
    };
  } else if (mockActionType) {
    return {
      payment_request_id: `pr-${randomUUID()}`,
      status: "REQUIRES_ACTION",
      channel_code: channelCode,
      actions: makeMockActions(mockActionType),
      session_token_request_id: randomUUID(),
    };
  } else {
    return {
      payment_request_id: `pr-${randomUUID()}`,
      status: "SUCCEEDED",
      channel_code: channelCode,
      actions: [],
      session_token_request_id: randomUUID(),
    };
  }
}

export function makeTestPaymentToken(
  channelCode: string,
  mockActionType: MockActionType | undefined,
): BffPaymentToken {
  if (mockActionType === "PENDING") {
    return {
      payment_token_id: `pt-${randomUUID()}`,
      status: "PENDING",
      channel_code: channelCode,
      actions: makeMockActions(mockActionType),
      session_token_request_id: randomUUID(),
    };
  } else if (mockActionType) {
    return {
      payment_token_id: `pt-${randomUUID()}`,
      status: "REQUIRES_ACTION",
      channel_code: channelCode,
      actions: makeMockActions(mockActionType),
      session_token_request_id: randomUUID(),
    };
  } else {
    return {
      payment_token_id: `pt-${randomUUID()}`,
      status: "ACTIVE",
      channel_code: channelCode,
      actions: [],
      session_token_request_id: randomUUID(),
    };
  }
}

export function makeMockActions(
  mockActionType: MockActionType | undefined,
): BffAction[] {
  return mockActionType ? [makeOneMockAction(mockActionType)] : [];
}

export function makeOneMockAction(mockActionType: MockActionType): BffAction {
  switch (mockActionType) {
    case "IFRAME":
      return {
        type: "REDIRECT_CUSTOMER",
        descriptor: "WEB_URL",
        value: "https://example.com/iframe",
        iframe_capable: true,
      };
    case "REDIRECT":
      return {
        type: "REDIRECT_CUSTOMER",
        descriptor: "WEB_URL",
        value: "https://example.com/redirect",
        iframe_capable: false,
      };
    case "QR":
      return {
        type: "PRESENT_TO_CUSTOMER",
        descriptor: "QR_STRING",
        value: "https://example.com/qr-code-data",
        action_title: "Pay with QR Code",
        action_subtitle: "Scan the QR code below",
        action_graphic: "",
        instructions: null,
      };
    case "BARCODE":
      return {
        type: "PRESENT_TO_CUSTOMER",
        descriptor: "PAYMENT_CODE",
        value: "1234567890",
        action_title: "Pay at a Store",
        action_subtitle: "Show this barcode to the cashier",
        action_graphic: "",
        instructions: null,
      };
    case "VA":
      return {
        type: "PRESENT_TO_CUSTOMER",
        descriptor: "VIRTUAL_ACCOUNT_NUMBER",
        value: "1234567890",
        action_title: "Pay with Virtual Account",
        action_subtitle:
          "Protect yourself from fraud - ensure all details are correct",
        action_graphic: "",
        instructions: null,
      };
  }
  throw new Error(`Unknown mock action type: ${mockActionType}`);
}

export function makeMockPaymentOptions(
  channelCode: string,
  session: BffSession,
): BffPaymentOptions {
  return {
    channel_code: channelCode,
    country: session.country,
    currency: session.currency,
    amount: session.amount,
    installment_plans: [
      {
        interval: "MONTH",
        interval_count: 1,
        terms: 3,
        installment_amount: Math.floor(session.amount / 3),
        total_amount: session.amount,
        description: `3x Installment — ${amountFormat(Math.floor(session.amount / 3), session.currency)}`,
        code: "3M",
        interest_rate: 1,
      },
      {
        interval: "MONTH",
        interval_count: 1,
        terms: 6,
        installment_amount: Math.floor(session.amount / 6),
        total_amount: session.amount,
        description: `6x Installment — ${amountFormat(Math.floor(session.amount / 6), session.currency)}`,
        code: "6M",
        interest_rate: 1,
      },
    ],
  };
}
