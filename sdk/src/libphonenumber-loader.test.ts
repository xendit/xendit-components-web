import { beforeEach, describe, expect, it, vi } from "vitest";

describe("libphonenumber-loader", () => {
  // module-level state must be reset between tests to avoid leaking state.
  beforeEach(() => {
    vi.resetModules();
  });

  it("should return null before anything has loaded", async () => {
    const { getLoadedLibphonenumber } = await import("./libphonenumber-loader");
    expect(getLoadedLibphonenumber()).toBeNull();
  });

  it("should not block when preloading", async () => {
    const { preloadLibphonenumber, getLoadedLibphonenumber } =
      await import("./libphonenumber-loader");
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

  it("should be safe to call preload multiple times", async () => {
    const { preloadLibphonenumber, getLibphonenumber } =
      await import("./libphonenumber-loader");
    preloadLibphonenumber();
    preloadLibphonenumber();
    preloadLibphonenumber();
    const mod = await getLibphonenumber();
    expect(typeof mod.parsePhoneNumberFromString).toBe("function");
  });

  it("should resolve concurrent calls to the same module instance", async () => {
    const { getLibphonenumber } = await import("./libphonenumber-loader");
    const [mod1, mod2] = await Promise.all([
      getLibphonenumber(),
      getLibphonenumber(),
    ]);
    expect(mod1).toBe(mod2);
  });
});
