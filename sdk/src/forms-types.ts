export type Channel = {
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
   * The group to which this channel belongs.
   * A reference to one of the group ids in the channel_ui_groups list.
   **/
  ui_group: string;

  /** V3 channel code */
  channel_code: string;

  /** The type of channel */
  pm_type: string;

  /** If true, supports PAY flow. */
  one_time_payment: boolean;

  /** If true, supports SAVE flow. */
  save_payment_information: boolean;

  /** Channel form */
  form: ChannelFormField[];

  /** Instruction text to show at bottom of form */
  instructions: string[];

  /** Special properties for cards */
  card?: {
    brands: {
      name: string;
      logo_url: string;
    }[];
  };
};

export type ChannelUiGroup = {
  /** Unique identifier for the group */
  id: string;
  /** Human readable group name */
  label: string;
  /** Group icon */
  icon_url: string;
};

export type ChannelFormField = {
  /** Label shown to user */
  label: string;
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
  /** If true, the field must not be empty. */
  required: boolean;
  /** 2 means full-width, 1 means half-width */
  span: 1 | 2;
  /** If true, hide label and collapse whitespace between this field and the previous one. */
  join?: boolean;
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

type ChannelPropertyPrimative = string | number | boolean | undefined;
export type ChannelProperty =
  | ChannelPropertyPrimative
  | ChannelPropertyPrimative[]
  | Record<string, ChannelPropertyPrimative>;
export type ChannelProperties = Record<string, ChannelProperty>;
