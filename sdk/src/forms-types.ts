export type FieldType =
  // credit card fields
  | { name: "credit_card_number" }
  | { name: "credit_card_expiry" }
  | { name: "credit_card_cvn" }

  // personal information fields requiring special validation
  | { name: "phone_number" }
  | { name: "email" }
  | {
      name: "street_address";
      line: number;
    }
  | { name: "postal_code" }

  // generic fields
  | {
      name: "generic_numeric";
      min_length: number;
      max_length: number;
    }
  | {
      name: "generic_text";
      min_length?: number;
      max_length: number;
      regex_validators?: {
        regex: string;
        message: string;
      }[];
    }
  | {
      name: "generic_dropdown";
      options: {
        label: string;
        subtitle?: string;
        icon?: string;
        value: string;
      }[];
    };

export type ChannelFormField = {
  /** Label shown to user */
  label: string;
  /** Placeholder texts */
  placeholder: string;
  /** Field behavior */
  type: FieldType;
  /** Where to write the property in the channel properties object. Can be dot-separated to write to a nested object. Can be a map for components that expose multiple values. */
  channel_property: string | Record<string, string>;
  /** If true, the field must not be empty. */
  required: boolean;
  /** 2 means full-width, 1 means half-width */
  span: 1 | 2;
  /** If true, hide label and collapse whitespace between this field and the previous one. */
  join?: boolean;
};

export type ChannelForm = ChannelFormField[];
