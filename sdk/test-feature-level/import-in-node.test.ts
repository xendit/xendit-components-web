// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("import in node", () => {
  it("should import successfully in node environment", async () => {
    // it should not crash
    await import("../src/index");
  });
  it("should throw if attempting to construct in node environment", async () => {
    const mod = await import("../src/index");
    expect(() => new mod.XenditComponentsTest({})).toThrow(
      "XenditComponents can only be instantiated in a browser",
    );
  });
});
