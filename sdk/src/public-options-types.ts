import { BffChannel, BffChannelUiGroup } from "./backend-types/channel";
import { InterceptLocaleStringsFn } from "./localization";
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

  /**
   * Configuration for styling the content inside iframe fields.
   */
  iframeFieldAppearance?: IframeAppearanceOptions;

  /**
   * Set this to true if you're resuming a session after the user returns from a redirection, i.e, the user is on your `return_url` page. The SDK will initialize with the same PaymentRequest or PaymentToken from the before the redirect, check it's status, and resume normal operation.
   *
   * We insert some values into the query string when returning from a redirect, which must be left intact.
   *
   * An `fatal-error` is fired if there is nothing to resume.
   */
  resume?: boolean;

  /**
   * A facilitated payment link is added to the page during redirect payments when the payment method supports it, so supporting browsers can offer to complete the payment directly instead of a full redirect. Set this to `true` to enable it.
   *
   * Default `false`.
   */
  enablePaylinks?: boolean;

  /**
   * @internal
   * Print telemetry events to console.
   */
  hostId?: string;

  /**
   * @internal
   * Print telemetry events to console.
   */
  logTelemetryEvents?: boolean;

  /**
   * @internal
   * Called before initialization, can modify locale strings. Use with caution.
   */
  interceptLocaleStrings?: InterceptLocaleStringsFn;

  /**
   * @internal
   * Called before initialization, can modify channel config. Use with caution.
   */
  interceptChannelConfig?: (config: {
    channels: BffChannel[];
    channel_ui_groups: BffChannelUiGroup[];
  }) => { channels: BffChannel[]; channel_ui_groups: BffChannelUiGroup[] };
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
  withCard?: boolean;
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
export type GooglePayButtonOptions = {
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
};

/**
 * @public
 */
export type ApplePayButtonOptions = {
  buttonStyle?: "black" | "white" | "white-outline";
  buttonType?:
    | "plain"
    | "buy"
    | "check-out"
    | "book"
    | "order"
    | "donate"
    | "subscribe";
};

/**
 * @public
 */
export type DigitalWalletOptions<T extends XenditDigitalWalletCode> =
  T extends "GOOGLE_PAY"
    ? GooglePayButtonOptions
    : T extends "APPLE_PAY"
      ? ApplePayButtonOptions
      : never;
