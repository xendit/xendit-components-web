import { describe, expect, it, vi, beforeEach } from "vitest";
import { SubmissionBehavior } from "../lifecycle/behaviors/submission";
import { BlackboardType } from "../lifecycle/behavior-tree";
import {
  BffPaymentEntity,
  BffPaymentEntityType,
} from "../backend-types/payment-entity";
import { XenditSubmissionEndEvent } from "../public-event-types";

// Mock functions with vi.hoisted to avoid hoisting issues
const { mockGetPaymentEntityStatusCopyKey, mockGetFailureCodeCopyKey } =
  vi.hoisted(() => ({
    mockGetPaymentEntityStatusCopyKey: vi.fn(),
    mockGetFailureCodeCopyKey: vi.fn(),
  }));

vi.mock("../backend-types/payment-entity", async () => {
  const actual = await vi.importActual("../backend-types/payment-entity");
  return {
    ...actual,
    getPaymentEntityStatusCopyKey: mockGetPaymentEntityStatusCopyKey,
    getFailureCodeCopyKey: mockGetFailureCodeCopyKey,
  };
});

describe("SubmissionBehavior - Exit Logic", () => {
  let mockBlackboard: Partial<BlackboardType>;
  let mockDispatchEvent: ReturnType<typeof vi.fn>;
  let mockTranslation: ReturnType<typeof vi.fn>;
  let submissionBehavior: SubmissionBehavior;
  let dispatchedEvents: Event[] = [];

  // Translation mock data
  const mockTranslations = {
    "payment_entity.request.failed.title": "Payment Failed",
    "payment_entity.request.failed.subtext": "Payment could not be processed",
    "failure_code.card_declined": "Your card was declined",
    failure_code_unknown: "A failure occurred with code {{failureCode}}",
    "default_error.title": "Error",
    "default_error.message_1": "There was a problem with the request.",
    "default_error.message_2": "Please try again later.",
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchedEvents = [];

    mockTranslation = vi
      .fn()
      .mockImplementation((key: string, params?: { failureCode?: string }) => {
        let result: string | undefined =
          mockTranslations[key as keyof typeof mockTranslations];
        if (params?.failureCode && result) {
          result = result.replace("{{failureCode}}", params.failureCode);
        }
        return result || key;
      });

    mockDispatchEvent = vi.fn().mockImplementation((event: Event) => {
      dispatchedEvents.push(event);
      return true;
    });

    mockBlackboard = {
      world: {
        session: { status: "ACTIVE" as const },
        paymentEntity: null,
      },
      dispatchEvent: mockDispatchEvent,
      sdk: {
        t: mockTranslation,
      },
    } as unknown as Partial<BlackboardType>;

    mockGetPaymentEntityStatusCopyKey.mockImplementation(
      (type: string, status: string, field: string) =>
        `payment_entity.${type.toLowerCase()}.${status.toLowerCase()}.${field}`,
    );

    mockGetFailureCodeCopyKey.mockImplementation(
      (failureCode: string) => `failure_code.${failureCode.toLowerCase()}`,
    );

    submissionBehavior = new SubmissionBehavior(
      mockBlackboard as BlackboardType,
    );
  });

  describe("Reason determination", () => {
    it("should set reason to SESSION_EXPIRED when session status is EXPIRED", () => {
      mockBlackboard.world!.session!.status = "EXPIRED";

      submissionBehavior.exit();

      const event = dispatchedEvents.find(
        (e): e is XenditSubmissionEndEvent =>
          e instanceof XenditSubmissionEndEvent,
      );
      expect(event).toBeTruthy();
      expect(event?.reason).toBe("SESSION_EXPIRED");
    });

    it("should set reason to PAYMENT_REQUEST_FAILED for failed payment request", () => {
      const mockPaymentEntity: BffPaymentEntity = {
        id: "pr_123",
        type: BffPaymentEntityType.PaymentRequest,
        entity: {
          payment_request_id: "pr_123",
          status: "FAILED",
          actions: [],
          channel_code: "CARD",
        },
      };

      mockBlackboard.world!.paymentEntity = mockPaymentEntity;

      submissionBehavior.exit();

      const event = dispatchedEvents.find(
        (e): e is XenditSubmissionEndEvent =>
          e instanceof XenditSubmissionEndEvent,
      );
      expect(event).toBeTruthy();
      expect(event?.reason).toBe("PAYMENT_REQUEST_FAILED");
    });
  });

  describe("Payment entity failure logic", () => {
    it("should create failure object with failure_code translation", () => {
      const mockPaymentEntity: BffPaymentEntity = {
        id: "pr_123",
        type: BffPaymentEntityType.PaymentRequest,
        entity: {
          payment_request_id: "pr_123",
          status: "FAILED",
          failure_code: "CARD_DECLINED",
          actions: [],
          channel_code: "CARD",
        },
      };

      mockBlackboard.world!.paymentEntity = mockPaymentEntity;

      submissionBehavior.exit();

      const event = dispatchedEvents.find(
        (e): e is XenditSubmissionEndEvent =>
          e instanceof XenditSubmissionEndEvent,
      );
      expect(event?.userErrorMessage).toEqual([
        "Payment Failed",
        "Your card was declined",
      ]);
      expect(event?.developerErrorMessage).toEqual({
        type: "FAILURE",
        code: "CARD_DECLINED",
      });
    });
  });

  describe("Translation integration", () => {
    it("should call translation functions with correct parameters", () => {
      const mockPaymentEntity: BffPaymentEntity = {
        id: "pr_123",
        type: BffPaymentEntityType.PaymentRequest,
        entity: {
          payment_request_id: "pr_123",
          status: "FAILED",
          failure_code: "INSUFFICIENT_BALANCE",
          actions: [],
          channel_code: "CARD",
        },
      };

      mockBlackboard.world!.paymentEntity = mockPaymentEntity;

      submissionBehavior.exit();

      expect(mockGetFailureCodeCopyKey).toHaveBeenCalledWith(
        "INSUFFICIENT_BALANCE",
      );
      expect(mockTranslation).toHaveBeenCalledWith(
        "failure_code.insufficient_balance",
        "A failure occurred with code INSUFFICIENT_BALANCE",
      );
    });
  });

  describe("Network error handling", () => {
    it("should dispatch default error when NetworkError is normal error", () => {
      const mockNetworkError = new Error();

      // Access private properties through unknown casting to avoid TS errors
      (
        submissionBehavior as unknown as {
          submissionError: Error;
        }
      ).submissionError = mockNetworkError;

      submissionBehavior.exit();

      const event = dispatchedEvents.find(
        (e): e is XenditSubmissionEndEvent =>
          e instanceof XenditSubmissionEndEvent,
      );
      expect(event?.reason).toBe("REQUEST_FAILED");
      expect(event?.userErrorMessage).toEqual([
        "Error",
        "There was a problem with the request.",
        "Please try again later.",
      ]);
      expect(event?.developerErrorMessage).toEqual({
        type: "NETWORK_ERROR",
        code: "NETWORK_ERROR",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle missing paymentEntity gracefully", () => {
      mockBlackboard.world!.paymentEntity = null;

      expect(() => submissionBehavior.exit()).not.toThrow();

      const event = dispatchedEvents.find(
        (e): e is XenditSubmissionEndEvent =>
          e instanceof XenditSubmissionEndEvent,
      );
      expect(event?.reason).toBe("ACTION_ABORTED");
    });
  });
});
