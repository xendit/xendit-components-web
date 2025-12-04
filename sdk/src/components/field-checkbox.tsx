import { useState, useEffect } from "preact/hooks";

interface Props {
  id?: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean; // For uncontrolled
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CheckboxField: React.FC<Props> = (props) => {
  const {
    id = "checkbox",
    label,
    checked,
    defaultChecked,
    onChange,
    disabled,
  } = props;

  // Determine if controlled or uncontrolled
  const isControlled = checked !== undefined;

  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );

  useEffect(() => {
    if (isControlled) {
      setInternalChecked(checked);
    }
  }, [checked, isControlled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = (e.target as HTMLInputElement)?.checked;

    // Only update internal state if uncontrolled
    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    onChange?.(e);
  };

  const checkedValue = isControlled ? checked : internalChecked;

  return (
    <div className="xendit-checkbox">
      <label htmlFor={id} className="xendit-text-14">
        {label}
      </label>
      <input
        id={id}
        type="checkbox"
        onChange={handleChange}
        checked={checkedValue}
        disabled={disabled}
      />
    </div>
  );
};
