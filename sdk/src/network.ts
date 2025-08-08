import { BffResponse } from "./bff-types";
import { V3PaymentRequest } from "./v3-types";

export async function fetchSessionData(
  sessionClientKey: string
): Promise<BffResponse> {
  const response = await fetch(`/api/session?clientKey=${sessionClientKey}`);
  if (!response.ok) {
    throw new Error("Failed to fetch session data");
  }
  return response.json();
}

export async function createPaymentRequest(
  sessionClientKey: string
): Promise<V3PaymentRequest> {
  const response = await fetch(
    `/api/session/payment_requests?clientKey=${sessionClientKey}`,
    { method: "POST" }
  );
  if (!response.ok) {
    throw new Error("Failed to create payment request");
  }
  return response.json();
}
