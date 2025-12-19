import { describe, it, expect } from "vitest";
import {
  XenditInitEvent,
  XenditComponents,
  XenditComponentsTest,
} from "../src";
import { findEvent, waitForEvent, watchEvents } from "./utils";

describe("initialization", () => {
  it("should fire the init event after constructing with mock data", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);

    const events = watchEvents(sdk, ["init"]);
    await waitForEvent(sdk, "init");

    const initEvent = findEvent(events, "init");
    expect(initEvent).toBeDefined();
    expect(initEvent?.name).toBe("init");
    expect(initEvent?.event).toBeInstanceOf(XenditInitEvent);
  });

  it("should be able to call getter methods only after init", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);

    expect(() => {
      sdk.getSession();
    }).toThrowError();
    expect(() => {
      sdk.getActiveChannels();
    }).toThrowError();
    expect(() => {
      sdk.getCustomer();
    }).toThrowError();

    await waitForEvent(sdk, "init");

    expect(sdk.getSession()).toEqual(
      expect.objectContaining({
        id: "ps-68f870c1d394132ab724261e",
      }),
    );
    expect(sdk.getCustomer()).toEqual(
      expect.objectContaining({
        id: "cust-78f95e42-4e9d-4556-827b-0e0b8ead68fc",
      }),
    );

    const cardsChannel = sdk.getActiveChannels().find((ch) => {
      return ch.channelCode === "CARDS";
    });
    expect(cardsChannel?.channelCode).toEqual("CARDS"); // cannot expect channel object due to getters
  });
});
