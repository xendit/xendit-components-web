import { FieldProps } from "./field";
import { formFieldName } from "../utils";
import { useLayoutEffect, useRef } from "preact/hooks";
import { FunctionComponent } from "preact";
import { Dropdown, DropdownOption } from "./dropdown";

export const FieldInstallmentPlan: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);
  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  function handleChange(option: DropdownOption): void {
    if (hiddenFieldRef.current) {
      hiddenFieldRef.current.value = option.value;
    }
    onChange();
  }

  useLayoutEffect(() => {
    // TODO
    // if options change and the current hidden field value is no longer an option, reset hidden field value
  }, []);

  return (
    <>
      <Dropdown
        id={id}
        placeholder={field.placeholder}
        className={`xendit-text-14`}
        onChange={handleChange}
        options={[]}
      />
      <input type="hidden" name={id} ref={hiddenFieldRef} />
    </>
  );
};
