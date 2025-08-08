import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";

export const DropdownField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  if (!isDropdownField(field)) {
    throw new Error("DropdownField expects field.type.name to be 'dropdown'");
  }

  return (
    <select name={id} onChange={onChange}>
      {field.type.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

function isDropdownField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "dropdown" };
} {
  return field.type.name === "dropdown";
}
