import { ChannelFormField } from "../forms-types";
import { CheckboxField } from "./field-checkbox";
import { CountryField } from "./field-country";
import { DropdownField } from "./field-dropdown";
import { IframeField } from "./field-iframe";
import { TextField } from "./field-text";

export interface FieldProps {
  field: ChannelFormField;
  onChange: () => void;
}

const Field: React.FC<FieldProps> = (props) => {
  const { field } = props;

  const id = formFieldName(field);

  function renderInner() {
    switch (field.type.name) {
      case "credit_card_number":
      case "credit_card_expiry":
      case "credit_card_cvn":
        return <IframeField {...props} />;
      case "text":
      case "phone_number":
      case "email":
      case "postal_code":
        return <TextField {...props} />;
      case "dropdown":
        return <DropdownField {...props} />;
      case "country":
        return <CountryField {...props} />;
      case "checkbox":
        return <CheckboxField {...props} />;
    }
  }

  return (
    <div
      className={`xendit-channel-form-field 
                  ${field.type.name === "checkbox" ? "xendit-form-field-checkbox" : ""} 
                  xendit-form-field-span-${field.span}`}
    >
      <label htmlFor={id} className="xendit-text-14">
        {field.label ?? ""}
      </label>
      {renderInner()}
    </div>
  );
};

export default Field;

export function formFieldName(field: ChannelFormField): string {
  let id: string;
  if (typeof field.channel_property === "string") {
    id = field.channel_property;
  } else {
    const keys = Object.values(field.channel_property);
    id = keys.join("__");
  }
  return id;
}
