import { IframeAppearanceOptions } from "../../shared/types";

/**
 * @public
 */
export interface XenditSdkOptions {
  /**
   * The client key from your session.
   * Your server should retrieve this from the Xendit API and pass it directly to the
   * client without saving or logging it anywhere.
   */
  sessionClientKey: string;
  iframeFieldAppearance?: IframeAppearanceOptions;
}

/**
 * @public
 */
export interface XenditChannelPickerComponentOptions {
  todo: string;
}

/**
 * @public
 */
export interface XenditPaymentChannelComponentOptions {
  todo: string;
}
