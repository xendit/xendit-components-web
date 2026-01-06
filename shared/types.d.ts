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

/**
 * @public
 */
export type IframeAppearanceOptions = {
  /**
   * Limited styles applied to iframe inputs.
   */
  inputFieldStyles?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    color?: string;
    backgroundColor?: string;
  };

  /**
   * Limited styles applied to iframe input placeholders.
   */
  placeholderStyles?: {
    color?: string;
  };

  /**
   * Custom font face to load within iframe fields.
   * If you use this, you don't need to specify fontFamily or fontWeight.
   */
  fontFace?: {
    /**
     * CSS font-face source descriptor (e.g. `url(...) format(...)`)
     */
    source: string;
    /**
     * Font face options. Font family and weight are set automatically.
     */
    descriptors?: Pick<FontFaceDescriptors, "display" | "style" | "stretch">;
  };
};
