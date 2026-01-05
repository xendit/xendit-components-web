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
   */
  sessionType: "PAY" | "SAVE";
  /**
   * The kind of session, only COMPONENT sessions can be used with the components SDK.
   */
  mode: "COMPONENT";
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
  status: "ACTIVE" | "CANCELED" | "EXPIRED" | "COMPLETED";
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
    image_url?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    metadata?: Record<string, string>;
  }[];
}

/**
 * @public
 */
export interface XenditCustomer {
  id: string;
  type: "INDIVIDUAL";

  /**
   * Merchant provided identifier for the customer
   */
  referenceId: string;

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
    /**
     * Country code for customer nationality. ISO 3166-1 alpha-2 Country Code.
     */
    nationality?: string;
    /**
     * City or other relevant location for the customer birth place.
     */
    placeOfBirth?: string;
    /**
     * Date of birth in the format YYYY-MM-DD.
     */
    dateOfBirth?: string;
    /**
     * Gender of customer.
     */
    gender?: "MALE" | "FEMALE" | "OTHER";
  };

  // TODO: business customers
}

/**
 * @public
 */
export interface XenditPaymentChannel {
  /**
   * The channel_code used to refer to this payment channel.
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
