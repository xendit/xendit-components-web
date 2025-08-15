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
  appearance?: {
    /**
     * Additional limited styles applied to iframe inputs.
     */
    inputFieldProperties?: {
      fontFamily: string;
      fontSize: string;
    };
  };
}

/**
 * @public
 */
export interface XenditSdkTestOptions {
  testNetworkFailure?: boolean;
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
