import { BffResponse } from "./bff-types";

export function makeTestBffData(): BffResponse {
  return {
    business: {
      country_of_operation: "",
      name: ""
    },
    customer: {
      id: "",
      type: "INDIVIDUAL",
      email: null,
      mobile_number: null,
      phone_number: null,
      business_detail: undefined,
      individual_detail: null
    },
    payment_methods: [
      {
        channel_code: "TEST_CHANNEL",
        logo_url: "https://example.com/logo.png",
        pm_type: "CARDS"
      },
      {
        channel_code: "TEST_CHANNEL_2",
        logo_url: "https://example.com/logo2.png",
        pm_type: "EWALLET"
      },
      {
        channel_code: "TEST_CHANNEL_3",
        logo_url: "https://example.com/logo3.png",
        pm_type: "QR_CODE"
      }
    ],
    payment_methods_groups: [
      {
        pm_type: "CARDS",
        group_label: "Test Group",
        group_icon: "https://example.com/group-icon.png",
        channels: ["TEST_CHANNEL", "TEST_CHANNEL_2"]
      },
      {
        pm_type: "QR_CODE",
        group_label: "Test Group 2",
        group_icon: "https://example.com/group-icon2.png",
        channels: ["TEST_CHANNEL_3"]
      }
    ],
    session: {
      amount: 0,
      business_id: "",
      cancel_return_url: "",
      capture_method: "AUTOMATIC",
      country: "",
      created: "",
      currency: "",
      customer_id: "",
      description: "",
      expires_at: "",
      locale: "",
      mode: "PAYMENT_LINK",
      payment_link_url: "",
      payment_session_id: "",
      reference_id: "",
      session_type: "SAVE",
      status: "ACTIVE",
      success_return_url: "",
      updated: ""
    }
  };
}
