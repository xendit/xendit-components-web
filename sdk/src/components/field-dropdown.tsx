import { ChannelFormField, FieldType } from "../forms-types";
import { Dropdown, DropdownOption } from "./dropdown";
import { FieldProps, formFieldName } from "./field";

const toDropdownOptions = (
  fieldOptions: (FieldType & { name: "dropdown" })["options"],
): DropdownOption[] => {
  return fieldOptions.map((opt) => ({
    title: opt.label,
    description: opt.subtitle,
    disabled: opt.disabled,
    value: opt.value,
  }));
};

export const DropdownField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  if (!isDropdownField(field)) {
    throw new Error("DropdownField expects field.type.name to be 'dropdown'");
  }

  return (
    <Dropdown
      id={id}
      placeholder={field.placeholder}
      options={toDropdownOptions(field.type.options)}
      onChange={onChange}
    />
  );
};

function isDropdownField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "dropdown" };
} {
  return field.type.name === "dropdown";
}
