import { useState, useEffect, useRef } from "preact/hooks";

interface Props {
  id?: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean; // For uncontrolled
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const booleanToString = (value: boolean): string => (value ? "true" : "false");

export const CheckboxField: React.FC<Props> = (props) => {
  const { id, label, checked, defaultChecked, onChange, disabled } = props;

  // Determine if controlled or uncontrolled
  const isControlled = checked !== undefined;

  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isControlled) {
      setInternalChecked(checked);
    }
  }, [checked, isControlled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = (e.target as HTMLInputElement)?.checked;
    if (hiddenFieldRef.current) {
      hiddenFieldRef.current.value = booleanToString(newChecked);
    }
    // Only update internal state if uncontrolled
    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    onChange?.(e);
  };

  return (
    <div className="xendit-checkbox">
      <label htmlFor={id} className="xendit-text-14">
        {label}
      </label>
      <input
        id={id}
        type="checkbox"
        onChange={handleChange}
        defaultChecked={defaultChecked}
        disabled={disabled}
      />
      <input
        type="hidden"
        name={id}
        ref={hiddenFieldRef}
        value={booleanToString(internalChecked)}
      />
    </div>
  );
};
