import { describe, it, expect } from "vitest";
import { validateText } from "../text";

describe("validateText", () => {
  it("returns invalid and empty for empty string", () => {
    const result = validateText("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("TEXT_TOO_SHORT");
  });

  it("returns invalid and empty for whitespace string", () => {
    const result = validateText("   ");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("TEXT_TOO_SHORT");
  });

  it("validates minimum length (1 character)", () => {
    const result = validateText("a");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
    expect(result.empty).toBe(false);
  });

  it("validates typical text", () => {
    const result = validateText("Hello, world!");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
    expect(result.empty).toBe(false);
  });

  it("validates text with spaces around", () => {
    const result = validateText("   some text   ");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
    expect(result.empty).toBe(false);
  });

  it("invalidates text longer than 255 characters", () => {
    const longText = "a".repeat(256);
    const result = validateText(longText);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("TEXT_TOO_LONG");
    expect(result.empty).toBe(false);
  });

  it("validates text exactly 255 characters", () => {
    const maxText = "a".repeat(255);
    const result = validateText(maxText);
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
    expect(result.empty).toBe(false);
  });
});
