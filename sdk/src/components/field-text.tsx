import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";

export const TextField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  return (
    <input
      name={id}
      type="text"
      placeholder={field.placeholder}
      className="xendit-text-14"
      onChange={onChange}
      minLength={isTextField(field) ? field.type.min_length : undefined}
      maxLength={isTextField(field) ? field.type.max_length : undefined}
    />
  );
};

function isTextField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "text" };
} {
  return field.type.name === "text";
}
