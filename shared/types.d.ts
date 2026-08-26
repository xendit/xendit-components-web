import { LocaleKey } from "../sdk/src/localization";

type IframeChangeEvent = {
  type: "xendit-iframe-change";
  encrypted: {
    iv: string;
    value: string;
  }[];
  empty: boolean;
  valid: boolean;
  validationErrorCodes: LocaleKey[];
  bin?: string;
};

type IframeReadyEvent = {
  type: "xendit-iframe-ready";
  ecdhPublicKey: string;
};

type IframeFocusEvent = {
  type: "xendit-iframe-focus";
};

type IframeBlurEvent = {
  type: "xendit-iframe-blur";
};

type IframeFailedInitEvent = {
  type: "xendit-iframe-failed-init";
};

type IframeActionCompleteEvent = {
  type: "xendit-iframe-action-complete";
  /**
   * Used to decide which mock update to perform.
   */
  mockStatus?: "success" | "fail";
};

type IframePopulateForSimulationEvent = {
  type: "xendit-iframe-populate-for-simulation";
  scenario: string;
};

export type IframeEvent =
  | IframeChangeEvent
  | IframeReadyEvent
  | IframeFocusEvent
  | IframeBlurEvent
  | IframeFailedInitEvent
  | IframeActionCompleteEvent
  | IframePopulateForSimulationEvent;

export type IframeFieldType =
  | "credit_card_number"
  | "credit_card_cvn"
  | "credit_card_expiry";
