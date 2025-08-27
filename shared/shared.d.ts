type CardBrand = "VISA" | "MASTERCARD";

type IframeChangeEvent = {
  type: "change";
  encrypted: {
    iv: string;
    value: string;
  }[];
  empty: boolean;
  valid: boolean;
  validationErrorCodes: string[];
  cardBrand: CardBrand | null;
};

type IframeReadyEvent = {
  type: "ready";
  ecdhPublicKey: string;
};

type IframeFocusEvent = {
  type: "focus";
};

type IframeBlurEvent = {
  type: "blur";
};

type IframeFailedInitEvent = {
  type: "failed_init";
};

export type IframeEvent =
  | IframeChangeEvent
  | IframeReadyEvent
  | IframeFocusEvent
  | IframeBlurEvent
  | IframeFailedInitEvent;

export type IframeFieldType =
  | "credit_card_number"
  | "credit_card_cvn"
  | "credit_card_expiry";

export type IframeValidationError =
  | "CREDIT_CARD_NUMBER_TOO_SHORT"
  | "CREDIT_CARD_NUMBER_TOO_LONG"
  | "CREDIT_CARD_NUMBER_LUHN"
  | "NOT_A_NUMBER"
  | "CREDIT_CARD_CVN_TOO_SHORT"
  | "CREDIT_CARD_CVN_TOO_LONG"
  | "CREDIT_CARD_EXPIRY_INVALID_FORMAT"
  | "CREDIT_CARD_EXPIRY_INVALID_DATE"
  | "CREDIT_CARD_EXPIRY_IN_PAST";
