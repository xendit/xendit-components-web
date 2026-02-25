import { XenditDigitalWalletCode } from "./public-data-types";

/**
 * @public
 */
export interface XenditSdkOptions {
  /**
   * The client key from your session.
   * Your server should retrieve this from the Xendit API and pass it directly to the
   * client without saving or logging it anywhere.
   */
  componentsSdkKey: string;
  iframeFieldAppearance?: IframeAppearanceOptions;
}

/**
 * @public
 * Options for retrieving payment channels.
 */
export interface XenditGetChannelsOptions {
  /**
   * Filter channels by their channel codes.
   * (If using a RegExp, do not use the `g` flag.)
   */
  filter: string | string[] | RegExp;
  /**
   * If true, channels that do not satisfy the session's min/max amount will be filtered out.
   * Default true.
   */
  filterMinMax?: boolean;
}

/**
 * @public
 * Options for configuring action containers.
 */
export interface ActionContainerOptions {
  /**
   * QR code specific options.
   */
  qrCode?: {
    /**
     * If true, only the QR code will be displayed without any additional UI elements.
     */
    qrCodeOnly?: boolean;
  };
}

/**
 * @public
 */
export type IframeAppearanceOptions = {
  /**
   * Limited styles applied to iframe inputs.
   */
  inputStyles?: {
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

/**
 * @public
 */
export type SetCurrentChannelOptions = {
  digitalWalletSubmission: boolean;
};

/**
 * @public
 */
export type DigitalWalletOptions<T extends XenditDigitalWalletCode> =
  T extends "GOOGLE_PAY"
    ? {
        buttonColor?: "default" | "black" | "white";
        buttonType?:
          | "pay"
          | "book"
          | "buy"
          | "checkout"
          | "order"
          | "plain"
          | "long"
          | "short";
        buttonRadius?: number;
        buttonSizeMode?: "fill" | "static";
        buttonBorderType?: "no_border" | "default_border";
      }
    : never;
