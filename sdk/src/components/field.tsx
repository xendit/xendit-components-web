import { FunctionComponent } from "preact";
import { ChannelFormField } from "../backend-types/channel";
import { CountryField } from "./field-country";
import { DropdownField } from "./field-dropdown";
import { IframeField } from "./field-iframe";
import { PhoneNumberField } from "./field-phone-number";
import { ProvinceField } from "./field-province";
import { TextField } from "./field-text";

export interface FieldProps {
  field: ChannelFormField;
  onChange: () => void;
  className?: string;
}

const Field: FunctionComponent<FieldProps> = (props) => {
  const { field, className } = props;

  function renderInner() {
    switch (field.type.name) {
      case "credit_card_number":
      case "credit_card_expiry":
      case "credit_card_cvn":
        return <IframeField {...props} />;
      case "phone_number":
        return <PhoneNumberField {...props} />;
      case "text":
      case "email":
      case "postal_code":
        return <TextField {...props} />;
      case "dropdown":
        return <DropdownField {...props} />;
      case "country":
        return <CountryField {...props} />;
      case "province":
        return <ProvinceField {...props} />;
    }
  }

  return (
    <div
      className={`${className} xendit-channel-form-field xendit-form-field-span-${field.span}`}
    >
      {renderInner()}
    </div>
  );
};

export default Field;
