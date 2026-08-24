import { FunctionComponent } from "preact";
import { ChannelFormField } from "../backend-types/channel";
import { CountryField } from "./field-country";
import { DropdownField } from "./field-dropdown";
import { IframeField } from "./field-iframe";
import {
  CreditCardNumberField,
  CreditCardExpiryField,
  CreditCardCvnField,
} from "./field-credit-card";
import { PhoneNumberField } from "./field-phone-number";
import { ProvinceField } from "./field-province";
import { TextField } from "./field-text";
import { FieldInstallmentPlan } from "./field-installment-plan";
import { useSdk } from "./session-provider";
import { internal } from "../internal";

export interface FieldProps {
  field: ChannelFormField;
  onChange: (isInitial?: boolean) => void;
  className?: string;
}

const Field: FunctionComponent<FieldProps> = (props) => {
  const { field, className } = props;
  const sdk = useSdk();
  const hasPublicKey = !!sdk[internal].sdkKey.publicKey;

  function renderInner() {
    switch (field.type.name) {
      case "credit_card_number":
        if (hasPublicKey) return <IframeField {...props} />;
        return <CreditCardNumberField {...props} />;
      case "credit_card_expiry":
        if (hasPublicKey) return <IframeField {...props} />;
        return <CreditCardExpiryField {...props} />;
      case "credit_card_cvn":
        if (hasPublicKey) return <IframeField {...props} />;
        return <CreditCardCvnField {...props} />;
      case "phone_number":
        return <PhoneNumberField {...props} />;
      case "text":
      case "email":
      case "postal_code":
        return <TextField {...props} />;
      case "dropdown":
        return <DropdownField {...props} />;
      case "installment_plan":
        return <FieldInstallmentPlan {...props} />;
      case "country":
        return <CountryField {...props} />;
      case "province":
        return <ProvinceField {...props} />;
    }

    field.type satisfies never;
    throw new Error(
      `Unsupported field type: ${(field as ChannelFormField).type.name}`,
    );
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
