import { describe, expect, it } from "vitest";
import { resolveResumeState, getResumeTokenRequestId } from "./resume";
import { BffPollResponse } from "./backend-types/common";
import {
  makeTestPaymentRequest,
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

describe("resolveResumeState", () => {
  it("returns resume state for a FAILED payment_request", () => {
    const result = resolveResumeState(pollWith("FAILED"), "tok-123");
    expect(result).not.toBeNull();
    expect(result?.sessionTokenRequestId).toBe("tok-123");
    expect(result?.paymentEntity.entity.status).toBe("FAILED");
  });

  it("returns resume state for EXPIRED and CANCELED", () => {
    expect(resolveResumeState(pollWith("EXPIRED"), "t")).not.toBeNull();
    expect(resolveResumeState(pollWith("CANCELED"), "t")).not.toBeNull();
  });

  it("returns null for non-terminal statuses", () => {
    expect(resolveResumeState(pollWith("PENDING"), "t")).toBeNull();
    expect(resolveResumeState(pollWith("REQUIRES_ACTION"), "t")).toBeNull();
    expect(resolveResumeState(pollWith("SUCCEEDED"), "t")).toBeNull();
  });

  it("returns null when there is no payment entity in the poll", () => {
    expect(resolveResumeState({ session }, "t")).toBeNull();
  });
});

describe("getResumeTokenRequestId", () => {
  it("returns the token_request_id from the query string", () => {
    expect(getResumeTokenRequestId("?token_request_id=tok-123")).toBe(
      "tok-123",
    );
  });

  it("preserves other params and still finds the token", () => {
    expect(
      getResumeTokenRequestId("?foo=bar&token_request_id=tok-9&baz=1"),
    ).toBe("tok-9");
  });

  it("returns null when the token_request_id is absent", () => {
    expect(getResumeTokenRequestId("?foo=bar")).toBeNull();
    expect(getResumeTokenRequestId("")).toBeNull();
  });
});
