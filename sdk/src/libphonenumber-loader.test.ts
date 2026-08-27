import { beforeEach, describe, expect, it, vi } from "vitest";

describe("libphonenumber-loader", () => {
  // module-level state must be reset between tests to avoid leaking state.
  beforeEach(() => {
    vi.resetModules();
  });

  it("should not expose the module before loading finishes", async () => {
    const { preloadLibphonenumber, getLoadedLibphonenumber } =
      await import("./libphonenumber-loader");
    expect(getLoadedLibphonenumber()).toBeNull();

    preloadLibphonenumber();
    expect(getLoadedLibphonenumber()).toBeNull();
  });

  it("should resolve to the real module and expose it synchronously afterwards", async () => {
    const { getLibphonenumber, getLoadedLibphonenumber } =
      await import("./libphonenumber-loader");
    const mod = await getLibphonenumber();
    expect(typeof mod.parsePhoneNumberFromString).toBe("function");
    expect(typeof mod.getCountries).toBe("function");
    expect(getLoadedLibphonenumber()).toBe(mod);
  });

  it("should auto-trigger loading even if preload was never called", async () => {
    const { getLibphonenumber } = await import("./libphonenumber-loader");
    const mod = await getLibphonenumber();
    expect(typeof mod.parsePhoneNumberFromString).toBe("function");
  });
});
