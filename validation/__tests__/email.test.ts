import { describe, it, expect } from "vitest";
import { validateEmail } from "../email";

describe("validateEmail", () => {
  it("returns empty for empty string", () => {
    const result = validateEmail("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
  });

  it("returns empty for whitespace string", () => {
    const result = validateEmail("   ");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
  });

  it("validates correct email format", () => {
    const validEmails = [
      "test@example.com",
      "user.name+tag@domain.co.uk",
      "a@b.co",
      "foo_bar@baz.io",
      "foo123@bar.net",
      "foo-bar@bar.com",
      "foo@sub.domain.com",
    ];
    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(true);
      expect(result.errorCodes).toEqual([]);
      expect(result.empty).toBe(false);
    });
  });

  it("invalidates incorrect email format", () => {
    const invalidEmails = [
      "plainaddress",
      "@missingusername.com",
      "username@.com",
      "username@com",
      "username@domain.",
      "username@domain.c",
      "username@domain..com",
      "username@domain,com",
      "username@domain@domain.com",
      "username@ domain.com",
      "username@domain .com",
    ];
    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.errorCodes).toContain("INVALID_EMAIL_FORMAT");
      expect(result.empty).toBe(false);
    });
  });
});
