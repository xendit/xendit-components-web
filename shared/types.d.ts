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
  validationErrorCodes: string[];
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

export type IframeValidationError =
  | "CREDIT_CARD_NUMBER_INVALID_LENGTH"
  | "CREDIT_CARD_NUMBER_INVALID"
  | "CREDIT_CARD_UNKNOWN_BRAND"
  | "CREDIT_CARD_NUMBER_LUHN"
  | "CREDIT_CARD_CVN_TOO_SHORT"
  | "CREDIT_CARD_CVN_TOO_LONG"
  | "CREDIT_CARD_EXPIRY_EMPTY"
  | "CREDIT_CARD_EXPIRY_INVALID"
  | "CREDIT_CARD_EXPIRY_INVALID_DATE"
  | "CREDIT_CARD_EXPIRY_IN_PAST"
  | "NOT_A_STRING"
  | "NOT_A_NUMBER";

export type FormFieldValidationError =
  | "INVALID_EMAIL_FORMAT"
  | "INVALID_POSTAL_CODE"
  | "INVALID_COUNTRY"
  | "INVALID_PHONE_NUMBER"
  | "TEXT_TOO_SHORT"
  | "TEXT_TOO_LONG"
  | "TEXT_REGEX_MISMATCH"
  | "NOT_A_STRING"
  | "NOT_A_NUMBER"
  | "PHONE_NUMBER_TOO_SHORT"
  | "PHONE_NUMBER_TOO_LONG"
  | "NOT_A_VALID_PHONE_NUMBER"
  | "FIELD_IS_REQUIRED";
