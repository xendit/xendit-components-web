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
 * Additional test-specific options for SDK initialization
 */
export interface XenditSdkTestOptions {
  /**
   * Set to true to initialize the SDK with test data instead of fetching from the server.
   */
  isTest?: boolean;
  testNetworkFailure?: boolean;
}

/**
 * @public
 * Complete options interface for SDK initialization, including both core and test options
 */
export interface XenditSdkInitOptions
  extends XenditSdkOptions,
    XenditSdkTestOptions {}

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
