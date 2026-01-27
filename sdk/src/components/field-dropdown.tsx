import { FunctionComponent } from "preact";
import { ChannelFormField, FieldType } from "../backend-types/channel";
import { formFieldId, formFieldName } from "../utils";
import { Dropdown, DropdownOption } from "./dropdown";
import { FieldProps } from "./field";
import { useCallback, useRef } from "preact/hooks";

const toDropdownOptions = (
  fieldOptions: (FieldType & { name: "dropdown" })["options"],
): DropdownOption[] => {
  return fieldOptions.map((opt) => ({
    title: opt.label,
    description: opt.subtitle,
    value: opt.value,
  }));
};

export const DropdownField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const onChangeWrapper = useCallback(
    (option: DropdownOption) => {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = option.value;
      }
      onChange();
    },
    [onChange],
  );

  if (!isDropdownField(field)) {
    throw new Error("DropdownField expects field.type.name to be 'dropdown'");
  }

  return (
    <>
      <Dropdown
        id={id}
        placeholder={field.placeholder}
        options={toDropdownOptions(field.type.options)}
        onChange={onChangeWrapper}
      />
      <input type="hidden" name={name} defaultValue="" ref={hiddenFieldRef} />
    </>
  );
};

function isDropdownField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "dropdown" };
} {
  return field.type.name === "dropdown";
}
