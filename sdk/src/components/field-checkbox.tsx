import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";

export const CheckboxField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  if (!isCheckboxField(field)) {
    throw new Error("CheckboxField expects field.type.name to be 'checkbox'");
  }

  return (
    <input
      name={id}
      type="checkbox"
      onChange={onChange}
      checked={field.type.checked}
    />
  );
};

function isCheckboxField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "checkbox" };
} {
  return field.type.name === "checkbox";
}
