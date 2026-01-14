export type BffChannel = {
  /**
   * Human readable name of channel.
   *
   * If two channels have the same brand_name, they appear as the same channel in the UI.
   * Some channels have different channel_codes and different
   **/
  brand_name: string;

  /** Brand logo */
  brand_logo_url: string;

  /**
   * Brand theme color. Hex color with leading #.
   * @example "#FF5733"
   */
  brand_color: string;

  /**
   * Type of payment method.
   */
  pm_type?: string;

  /**
   * The group to which this channel belongs.
   * A reference to one of the group ids in the channel_ui_groups list.
   **/
  ui_group: string;

  /** V3 channel code */
  channel_code: string;

  /** If true, user is allowed to uncheck the "Save" checkbox in PAY flow with optional saving. */
  allow_pay_without_save: boolean;

  /** If true, user is allowed to check the "Save" checkbox in PAY flow. */
  allow_save: boolean;

  /** Channel form */
  form: ChannelFormField[];

  /** Optional banner to display between form and instructions, spans full width */
  banner?: BffChannelBanner;

  /** Instruction text to show at bottom of form */
  instructions: string[];

  /** If session amount is outside this range, disable the channel */
  min_amount?: number;
  max_amount?: number;

  /** If true, user must provide customer details if not provided */
  requires_customer_details?: boolean;

  /** Special properties for cards */
  card?: {
    brands: {
      name: string;
      logo_url: string;
    }[];
  };
};

export type BffChannelBanner = {
  /** Banner image URL */
  image_url: string;
  /** Alt text for accessibility */
  alt_text: string;
  /** Optional link destination when banner is clicked */
  link_url?: string;
  /** Aspect ratio to help with layout */
  aspect_ratio?: number;
};

export type BffChannelUiGroup = {
  /** Unique identifier for the group */
  id: string;
  /** Human readable group name */
  label: string;
  /** Group icon */
  icon_url: string;
};

export type ChannelFormField = {
  /** Label shown in error messages and a11y */
  label: string;
  /** Label shown as text above the field, if this field is the first in it's group. Defaults to `label` */
  group_label?: string;
  /** Placeholder text */
  placeholder: string;
  /** Field behavior */
  type: FieldType;
  /**
   * Where to write the property in the channel properties object.
   * Can be dot-separated to write to a nested object.
   * Can be an array for components that expose multiple values.
   *
   * @example
   * "billing_information.street_line1" -> { billing_information: { street_line1: "value" } }
   * ["expiry_month", "expiry_year"] -> { expiry_month: "value1", expiry_year: "value2" }
   **/
  channel_property: string | string[];
  /** Initial value of field */
  initial_value?: string;
  /** If true, user cannot edit */
  disabled?: boolean;
  /** If true, the field must not be empty. */
  required: boolean;
  /** 2 means full-width, 1 means half-width */
  span: 1 | 2;
  /** If true, hide label and collapse whitespace between this field and the previous one. */
  join?: boolean;
  /** If any condition doesn't match, the field is not shown */
  display_if?: Array<[string, "equals" | "not_equals", string]>;
  /** Additional flags */
  flags?: {
    /* If true, hide by default, show only for some countries */
    require_billing_information?: boolean;
  };
};

export type FieldType =
  // credit card fields (iframe fields)
  | { name: "credit_card_number" }
  | { name: "credit_card_expiry" }
  | { name: "credit_card_cvn" }

  // special fields
  // has country code dropdown
  | { name: "phone_number" }
  // has email validation
  | { name: "email" }
  // has postal code validation, possibly address autofill in the future
  | { name: "postal_code" }
  // has dropdown with flags, and a large list of options
  | { name: "country" }
  // has dropdown with a list of provinces/states depending on the selected country
  | { name: "province" }

  // generic fields
  | {
      name: "text";
      min_length?: number;
      max_length: number;
      numeric?: boolean;
      regex_validators?: {
        regex: string;
        message: string;
      }[];
    }
  | {
      name: "dropdown";
      options: {
        label: string;
        subtitle?: string;
        icon_url?: string;
        value: string;
      }[];
    };

/**
 * @public
 */
export type ChannelPropertyPrimative = string | number | boolean | undefined;

/**
 * @public
 * Channel properties for a payment method or payment token.
 */
export interface ChannelProperties {
  [key: string]:
    | ChannelPropertyPrimative
    | ChannelPropertyPrimative[]
    | ChannelProperties;
}
