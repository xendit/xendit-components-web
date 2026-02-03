import { describe, expect, it } from "vitest";
import { makeTestBffData } from "./test-data";
import {
  bffChannelsToPublic,
  bffCustomerToPublic,
  bffSessionToPublic,
  bffUiGroupsToPublic,
  findChannelPairs,
} from "./bff-marshal";
import { assert } from "./utils";

describe("BFF Marshal - bffSessionToPublic", () => {
  it("should generate a public session object", () => {
    const bffSession = makeTestBffData().session;
    const publicSession = bffSessionToPublic(bffSession);
    expect(publicSession).toEqual(
      expect.objectContaining({
        id: bffSession.payment_session_id,
        description: bffSession.description,
        sessionType: bffSession.session_type,
      }),
    );
  });
});

describe("BFF Marshal - bffCustomerToPublic", () => {
  it("should generate a public customer object", () => {
    const bffCustomer = makeTestBffData().customer;
    const publicCustomer = bffCustomerToPublic(bffCustomer);
    expect(publicCustomer).toEqual(
      expect.objectContaining({
        id: bffCustomer.id,
        email: bffCustomer.email,
        type: bffCustomer.type,
        individualDetail: expect.objectContaining({
          givenNames: bffCustomer.individual_detail?.given_names,
        }),
      }),
    );
  });
});

describe("BFF Marshal - findChannelPairs", () => {
  it("should resolve paired channels correctly", () => {
    const channels = makeTestBffData().channels;
    const pairData = findChannelPairs(channels);
    expect(pairData).toEqual({
      pairs: {
        UI_PAIRED_CHANNELS_TEST_1: [
          channels.find(
            (ch) => ch.channel_code === "UI_PAIRED_CHANNELS_TEST_1",
          ),
          channels.find(
            (ch) => ch.channel_code === "UI_PAIRED_CHANNELS_TEST_2",
          ),
        ],
      },
      paired: {
        UI_PAIRED_CHANNELS_TEST_2: true,
      },
    });
  });
});

describe("BFF Marshal - bffChannelsToPublic", () => {
  it("should convert BFF channels to public channels", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicChannels = bffChannelsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: false },
        pairChannels: pairChannels,
      },
    );

    const qrChannel = publicChannels.find((ch) => ch.channelCode === "MOCK_QR");
    assert(qrChannel);
    expect(qrChannel.brandName).toEqual("Mock QR Channel");

    // should have the same number of channels, minus the paired ones
    expect(publicChannels.length).toBe(
      testData.channels.length - Object.keys(pairChannels.pairs).length,
    );
  });
  it("should have references to the containing group", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicChannels = bffChannelsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: false },
        pairChannels: pairChannels,
      },
    );

    const qrChannel = publicChannels.find((ch) => ch.channelCode === "MOCK_QR");
    assert(qrChannel);

    // check that the uiGroup getter works
    expect(qrChannel.uiGroup.label).toEqual("Other Mock Channels");

    // the containing group should have this channel in its channels list
    expect(qrChannel.uiGroup.channels).toContainEqual(
      expect.objectContaining({
        channelCode: "MOCK_QR",
      }),
    );
  });
  it("should be able to filter out channels outside the min/max amount range", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicChannels = bffChannelsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: true },
        pairChannels: pairChannels,
      },
    );

    // disabled channel should not be present
    const disabledChannel = publicChannels.find(
      (ch) => ch.channelCode === "GROUP_DISABLED_GROUP_TEST",
    );
    expect(disabledChannel).toBeUndefined();

    // all channels should be in range
    expect(
      publicChannels.every((ch) => {
        const min = ch.minAmount ?? 0;
        const max = ch.maxAmount ?? Number.MAX_SAFE_INTEGER;
        const amount = testData.session.amount;
        return amount >= min && amount <= max;
      }),
    ).toBe(true);

    // the filter should also apply to the containing group's channels list
    const channelWithDisabledSibling = publicChannels.find(
      (ch) => ch.channelCode === "GROUP_PARTIAL_DISABLED_1",
    );
    assert(channelWithDisabledSibling);
    expect(channelWithDisabledSibling.uiGroup.channels.length).toBe(1);
  });
  it("should be able to filter channels by string", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicChannels = bffChannelsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: false, filter: "MOCK_QR" },
        pairChannels: pairChannels,
      },
    );

    expect(publicChannels.length).toBe(1);
    expect(publicChannels[0].channelCode).toBe("MOCK_QR");

    // the filter should also apply to the containing group's channels list
    expect(publicChannels[0].uiGroup.channels.length).toBe(1);
    expect(publicChannels[0].uiGroup.channels[0].channelCode).toBe("MOCK_QR");
  });
  it("should be able to filter channels by array of strings", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicChannels = bffChannelsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: false, filter: ["MOCK_QR", "CARDS"] },
        pairChannels: pairChannels,
      },
    );

    expect(publicChannels.length).toBe(2);
    expect(publicChannels.map((ch) => ch.channelCode)).toEqual([
      "CARDS",
      "MOCK_QR",
    ]);

    // the filter should also apply to the containing group's channels list
    expect(publicChannels[1].uiGroup.channels.length).toBe(1);
    expect(publicChannels[1].uiGroup.channels[0].channelCode).toBe("MOCK_QR");
  });
  it("should be able to filter channels by regex", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicChannels = bffChannelsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: false, filter: /mock_.*/i },
        pairChannels: pairChannels,
      },
    );

    expect(publicChannels.length).toBe(7);
    expect(publicChannels.map((ch) => ch.channelCode)).toEqual([
      "MOCK_EWALLET",
      "MOCK_EWALLET_IFRAME",
      "MOCK_EWALLET_WITH_PHONE",
      "MOCK_QR",
      "MOCK_DIRECT_DEBIT",
      "MOCK_OTC",
      "MOCK_VA",
    ]);
  });
});

describe("BFF Marshal - bffUiGroupsToPublic", () => {
  it("should convert BFF channels to public channels", () => {
    const testData = makeTestBffData();
    const pairChannels = findChannelPairs(testData.channels);
    const publicGroups = bffUiGroupsToPublic(
      testData.channels,
      testData.channel_ui_groups,
      {
        session: testData.session,
        options: { filterMinMax: false },
        pairChannels: pairChannels,
      },
    );

    const mockGroup = publicGroups.find((g) => g.groupId === "other");
    assert(mockGroup);
    expect(mockGroup.label).toEqual("Other Mock Channels");

    const qrChannel = mockGroup.channels.find(
      (ch) => ch.channelCode === "MOCK_QR",
    );
    assert(qrChannel);
    expect(qrChannel.brandName).toEqual("Mock QR Channel");

    // should have the same number of channels that have the matching group id
    expect(mockGroup.channels.length).toBe(
      testData.channels.filter((ch) => ch.ui_group === mockGroup.groupId)
        .length,
    );
  });
});
