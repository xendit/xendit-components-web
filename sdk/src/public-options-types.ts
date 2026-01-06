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
 * Options for retrieving payment channels.
 */
export interface XenditGetChannelsOptions {
  /**
   * If true, channels that do not satisfy the session's min/max amount will be filtered out.
   * Default true.
   */
  filterMinMax?: boolean;
}
