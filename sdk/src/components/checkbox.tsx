import { useIdSafe } from "../utils";

interface Props {
  id?: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Checkbox component
 */
export const Checkbox: React.FC<Props> = (props) => {
  const { id, label, checked, onChange, disabled } = props;

  const generatedId = useIdSafe();
  const htmlId = id || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
  };

  return (
    <div className="xendit-checkbox">
      <div className="xendit-checkbox-box">
        <input
          id={htmlId}
          type="checkbox"
          onChange={handleChange}
          checked={checked}
          disabled={disabled}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="xendit-checkbox-graphic"
        >
          <polyline
            points="40 144 96 200 224 72"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          ></polyline>
        </svg>
      </div>
      <label htmlFor={htmlId} className="xendit-text-14">
        {label}
      </label>
    </div>
  );
};
