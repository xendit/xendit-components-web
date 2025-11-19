import { LocaleKey } from "../sdk/src/localization";

type CardBrand =
  | "VISA"
  | "MASTERCARD"
  | "AMERICAN-EXPRESS"
  | "JCB"
  | "DISCOVER"
  | "DINERS-CLUB"
  | "UNIONPAY";

type IframeChangeEvent = {
  type: "xendit-iframe-change";
  encrypted: {
    iv: string;
    value: string;
  }[];
  empty: boolean;
  valid: boolean;
  validationErrorCodes: LocaleKey[];
  cardBrand: CardBrand | null;
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

export type IframeEvent =
  | IframeChangeEvent
  | IframeReadyEvent
  | IframeFocusEvent
  | IframeBlurEvent
  | IframeFailedInitEvent
  | IframeActionCompleteEvent;

export type IframeFieldType =
  | "credit_card_number"
  | "credit_card_cvn"
  | "credit_card_expiry";
