import {
  BffChannel,
  BffChannelUiGroup,
  ChannelProperties,
} from "./backend-types/channel";
import { internal } from "./internal";

/**
 * @public
 */
export interface XenditSession {
  /**
   * Session ID with prefix `ps-`.
   */
  id: string;
  /**
   * Description of the transaction provided by merchant on session creation.
   * The SDK does not use this, but you may show it to your users.
   */
  description?: string;
  /**
   * The type of session.
   *
   * PAY sessions create a payment request, calling /v3/payment_requests
   * SAVE sessions create a saved payment token, calling /v3/payment_tokens
   * SUBSCRIPTION sessions create a subscription, also calling /v3/payment_tokens
   */
  sessionType: "PAY" | "SAVE" | "SUBSCRIPTION";
  /**
   * The kind of session. CARDS_SESSION_JS sessions are not supported.
   */
  mode: "COMPONENTS" | "PAYMENT_LINK";
  /**
   * Merchant provided identifier for the session.
   */
  referenceId: string;
  /**
   * ISO 3166-1 alpha-2 two-letter country code for the country of transaction.
   */
  country: string;
  /**
   * ISO 4217 three-letter currency code for the payment.
   */
  currency: string;
  /**
   * For mode=PAY, the amount to be collected.
   * For mode=SAVE, this will always be 0.
   */
  amount: number;
  /**
   * A map of channels to channel properties provided by merchant on session creation.
   *
   * Keys are channel codes in lowercase.
   */
  channelProperties?: Record<string, ChannelProperties>;
  /**
   * When the session will expire. After this, it cannot be used, you'll need to create a new session.
   */
  expiresAt: Date;
  /**
   * Locale code for the session.
   */
  locale: string;
  /**
   * Status of the session.
   */
  status: "ACTIVE" | "PENDING" | "CANCELED" | "EXPIRED" | "COMPLETED";
  /**
   * The URL to redirect to on completed session. This is not automatically used unless you call `redirectToReturnUrl`.
   */
  successReturnUrl?: string;
  /**
   * The URL to redirect to on canceled or expired session. This is not automatically used unless you call `redirectToReturnUrl`.
   */
  cancelReturnUrl?: string;
  /**
   * Indicates whether the customer is allowed to save their payment method during this session.
   *
   * DISABLED means users do not have the option to save a payment method.
   * OPTIONAL means users are given a checkbox to choose whether to save their payment method.
   * FORCED means users must save their payment method and only channels that support saving will be shown.
   * undefined means the merchant has not specified this preference or this is not a PAY session.
   *
   * If the user wishes to save a payment method, `/v3/payment_requests` will be called with type="PAY_AND_SAVE".
   */
  allowSavePaymentMethod?: "DISABLED" | "OPTIONAL" | "FORCED";
  /**
   * Indicates whether the payment will be captured automatically or manually.
   */
  captureMethod?: "AUTOMATIC" | "MANUAL";
  /**
   * For subscription sessions, the subscription details. This will be undefined for PAY and SAVE sessions.
   */
  subscription?: {
    /**
     * Whether the first payment for the subscription should be made immediately upon session completion, or only after the anchor date.
     */
    immediatePayment?: boolean;
    /**
     * The subscription schedule. This includes the anchor date, which determines when the subscription payments will be made, as well as the interval and count for both the regular payments and the retries.
     */
    schedule: {
      /**
       * The anchor date for the subscription. This determines when the subscription payments will be made.
       */
      anchorDate: Date;
      /**
       * The interval for the subscription payments.
       */
      interval: "DAY" | "WEEK" | "MONTH";
      /**
       * The number of intervals for the subscription payments.
       */
      intervalCount: number;
      /**
       * The interval for retrying failed subscription payments.
       */
      retryInterval?: "DAY" | "WEEK" | "MONTH";
      /**
       * The number of intervals for retrying failed subscription payments.
       */
      retryIntervalCount?: number;
      /**
       * The total number of subscription payments.
       */
      totalRecurrence?: number;
      /**
       * The total number of retry attempts for failed subscription payments.
       */
      totalRetry?: number;
    };
  };
  /**
   * Line items. The components SDK does not use this, but you may show it to your users.
   */
  items?: {
    /**
     * The type of item
     */
    type:
      | "DIGITAL_PRODUCT"
      | "PHYSICAL_PRODUCT"
      | "DIGITAL_SERVICE"
      | "PHYSICAL_SERVICE"
      | "FEE";
    /**
     * Your reference ID for the item.
     */
    referenceId?: string;
    /**
     * Name of the item.
     */
    name: string;
    /**
     * Price per item. Can be negative for discounts. Total line item amount is net_unit_amount * quantity.
     */
    netUnitAmount: number;
    /**
     * Number of items in this line item.
     */
    quantity: number;
    url?: string;
    imageUrl?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    metadata?: Record<string, string>;
  }[];
  /**
   * Last updated date. If the session is completed, expired, or canceled, then this timestamp is when that status change happened.
   */
  updated: Date;
}

/**
 * @internal
 */
export interface XenditBusiness {
  /**
   * Name of the business
   */
  name?: string;

  /**
   * Country name which the business operates in
   */
  countryOfOperation?: string;

  /**
   * Full URL pointing to the business profile picture asset
   */
  merchantProfilePictureUrl?: string;
}

/**
 * @public
 */
export interface XenditCustomer {
  id: string;
  type: "INDIVIDUAL";

  /**
   * E-mail address of customer.
   */
  email?: string;

  /**
   * Mobile number of customer in E.164 format +(country code)(subscriber number)
   */
  mobileNumber?: string;

  individualDetail: {
    /**
     * Primary or first name(s) of customer.
     */
    givenNames: string;
    /**
     * Last or family name of customer.
     */
    surname?: string;
  };
}

/**
 * @internal
 */
export interface XenditSucceededChannel {
  /**
   * The channel_code used to refer to this payment channel.
   */
  channelCode: string;
  /**
   * The logo URL of the payment channel.
   */
  logoUrl: string;
}

/**
 * @public
 */
export interface XenditPaymentChannel {
  /**
   * The channel_code used to refer to this payment channel.
   *
   * This is either a string or an array of strings.
   *
   * In some cases (e.g. GOPAY), channels that are semantically the same have different channel codes depending
   * on whether they're being used for pay or pay and save. In that case this will be an array of two channel codes.
   */
  channelCode: string | string[];
  /**
   * The display name of the payment channel.
   */
  brandName: string;
  /**
   * The theme color associated with the payment channel, in hex format.
   *
   * This will always be suitable for use as a background color with white text.
   */
  brandColor: string;
  /**
   * The logo URL of the payment channel.
   */
  brandLogoUrl: string;
  /**
   * UI group to which this channel belongs.
   *
   * This is a suggestion for how to organize channels in your UI.
   */
  uiGroup: XenditPaymentChannelGroup;
  /**
   * The minimum amount for which this channel can be used.
   */
  minAmount?: number;
  /**
   * The maximum amount for which this channel can be used.
   */
  maxAmount?: number;
  /**
   * If this is a cards channel, the supported card brands.
   */
  cardBrands?: {
    name: string;
    logoUrl: string;
  }[];

  /** @internal */
  [internal]: BffChannel[];
}

/**
 * @public
 */
export interface XenditPaymentChannelGroup {
  /**
   * An arbitrary identifier.
   */
  groupId: string;
  /**
   * The display name of the group.
   */
  label: string;
  /**
   * The sort priority of the group.
   */
  channels: readonly XenditPaymentChannel[];
  /** @internal */
  [internal]: BffChannelUiGroup;
}

/**
 * @public
 */
export type XenditDigitalWalletCode = "GOOGLE_PAY" | "APPLE_PAY";

/**
 * @public
 */
export type XenditDigitalWallet = {
  /**
   * Identifier for the digital wallet.
   */
  digitalWalletCode: XenditDigitalWalletCode;
  /**
   * The supported channel codes for this digital wallet.
   */
  channels: XenditPaymentChannel[];
  /**
   * @internal
   */
  [internal]: true;
};
