import { describe, expect, it } from "vitest";
import { resolveResumeState, getResumeParams } from "./resume";
import { BffPollResponse } from "./backend-types/common";
import {
  makeTestPaymentRequest,
  makeTestPaymentToken,
  withPaymentEntityStatus,
} from "./data/test-data-modifiers";
import { makeTestBffData } from "./data/test-data";

const session = makeTestBffData().session;

function pollWith(status: string): BffPollResponse {
  return {
    session,
    payment_request: withPaymentEntityStatus(
      makeTestPaymentRequest("MOCK_QR", undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status as any,
    ),
  };
}

function pollWithToken(status: string): BffPollResponse {
  return {
    session,
    payment_token: withPaymentEntityStatus(
      makeTestPaymentToken("MOCK_QR", undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status as any,
    ),
  };
}

describe("resolveResumeState", () => {
  it("returns resume state for a FAILED payment_request", () => {
    const result = resolveResumeState(pollWith("FAILED"), "tok-123", null);
    expect(result).not.toBeNull();
    expect(result?.sessionTokenRequestId).toBe("tok-123");
    expect(result?.paymentEntity.entity.status).toBe("FAILED");
  });

  it("returns resume state for any payment entity status", () => {
    expect(resolveResumeState(pollWith("EXPIRED"), "t", null)).not.toBeNull();
    expect(resolveResumeState(pollWith("CANCELED"), "t", null)).not.toBeNull();
    expect(resolveResumeState(pollWith("PENDING"), "t", null)).not.toBeNull();
    expect(
      resolveResumeState(pollWith("REQUIRES_ACTION"), "t", null),
    ).not.toBeNull();
    expect(resolveResumeState(pollWith("SUCCEEDED"), "t", null)).not.toBeNull();
  });

  it("maps REQUIRES_ACTION + FAILED to FAILED (payment_request)", () => {
    expect(
      resolveResumeState(pollWith("REQUIRES_ACTION"), "t", "FAILED")
        ?.paymentEntity.entity.status,
    ).toBe("FAILED");
  });

  it("maps REQUIRES_ACTION + FAILED to FAILED (payment_token)", () => {
    expect(
      resolveResumeState(pollWithToken("REQUIRES_ACTION"), "t", "FAILED")
        ?.paymentEntity.entity.status,
    ).toBe("FAILED");
  });

  it("maps REQUIRES_ACTION + SUCCESS to SUCCEEDED for a payment_request", () => {
    expect(
      resolveResumeState(pollWith("REQUIRES_ACTION"), "t", "SUCCESS")
        ?.paymentEntity.entity.status,
    ).toBe("SUCCEEDED");
  });

  it("maps REQUIRES_ACTION + SUCCESS to ACTIVE for a payment_token", () => {
    expect(
      resolveResumeState(pollWithToken("REQUIRES_ACTION"), "t", "SUCCESS")
        ?.paymentEntity.entity.status,
    ).toBe("ACTIVE");
  });

  it("leaves REQUIRES_ACTION unchanged when there is no hint", () => {
    expect(
      resolveResumeState(pollWith("REQUIRES_ACTION"), "t", null)?.paymentEntity
        .entity.status,
    ).toBe("REQUIRES_ACTION");
  });

  it("does not override a status that is already settled", () => {
    expect(
      resolveResumeState(pollWith("PENDING"), "t", "FAILED")?.paymentEntity
        .entity.status,
    ).toBe("PENDING");
    expect(
      resolveResumeState(pollWith("SUCCEEDED"), "t", "FAILED")?.paymentEntity
        .entity.status,
    ).toBe("SUCCEEDED");
  });

  it("returns null when there is no payment entity in the poll", () => {
    expect(resolveResumeState({ session }, "t", null)).toBeNull();
  });
});

describe("getResumeParams", () => {
  it("reads token_request_id and component_status from the query string", () => {
    const params = getResumeParams(
      "?token_request_id=tok-123&component_status=FAILED",
    );
    expect(params.tokenRequestId).toBe("tok-123");
    expect(params.componentStatus).toBe("FAILED");
  });

  it("preserves other params and still finds both values", () => {
    const params = getResumeParams(
      "?foo=bar&token_request_id=tok-9&baz=1&component_status=SUCCESS",
    );
    expect(params.tokenRequestId).toBe("tok-9");
    expect(params.componentStatus).toBe("SUCCESS");
  });

  it("returns nulls when the params are absent", () => {
    const params = getResumeParams("?foo=bar");
    expect(params.tokenRequestId).toBeNull();
    expect(params.componentStatus).toBeNull();
    const empty = getResumeParams("");
    expect(empty.tokenRequestId).toBeNull();
    expect(empty.componentStatus).toBeNull();
  });
});
