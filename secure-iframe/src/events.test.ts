import { describe, expect, it } from "vitest";
import { assertIsSecureInputEvent, SecureInputEvent } from "./events";

describe("secure iframe ui - assertIsSecureInputEvent", () => {
  it("should throw if the arg is not SecureInputEvent", () => {
    assertIsSecureInputEvent(new SecureInputEvent("change", { value: "test" }));
    expect(() => assertIsSecureInputEvent(new Event("test"))).toThrow();
  });
});
