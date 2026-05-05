import { FunctionComponent } from "preact";
import { ChannelFormField, FieldType } from "../backend-types/channel";
import { formFieldId, formFieldName } from "../utils";
import { Dropdown, DropdownOption } from "./core/dropdown";
import { FieldProps } from "./field";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";

const toDropdownOptions = (
  fieldOptions: (FieldType & { name: "dropdown" })["options"],
): DropdownOption[] => {
  return fieldOptions.map((opt) => ({
    title: opt.label,
    description: opt.subtitle,
    value: opt.value,
    leadingAsset: opt.icon_url ? (
      <img
        style={{
          height: "16px",
          width: "16px",
          objectFit: "contain",
        }}
        src={opt.icon_url}
      />
    ) : null,
  }));
};

export const DropdownField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  if (!isDropdownField(field)) {
    throw new Error("DropdownField expects field.type.name to be 'dropdown'");
  }

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const dropdownItems = useMemo(() => {
    return toDropdownOptions(field.type.options);
  }, [field.type.options]);

  const [selectedItemValue, setSelectedItemValue] = useState<string>(
    field.initial_value ?? "",
  );

  const onChangeWrapper = useCallback(
    (option: DropdownOption) => {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = option.value;
      }
      setSelectedItemValue(option.value);
      onChange();
    },
    [onChange],
  );

  const selectedIndex = dropdownItems.findIndex(
    (opt) => opt.value === selectedItemValue,
  );

  return (
    <>
      <Dropdown
        id={id}
        placeholder={field.placeholder}
        options={dropdownItems}
        onChange={onChangeWrapper}
        selectedIndex={selectedIndex}
        className="xendit-form-field-inner"
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
