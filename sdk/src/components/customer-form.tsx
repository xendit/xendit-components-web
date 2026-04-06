import { forwardRef } from "preact/compat";
import { CustomerDetails } from "../backend-types/customer";

type Props = {
  onChange: (customerDetails: CustomerDetails) => void;
};

export const CustomerForm = forwardRef<HTMLFormElement, Props>(
  ({ onChange }, ref) => {
    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      onChange({ given_names: target.value });
    };

    return (
      <form ref={ref}>
        <div className="xendit-channel-form-field-group">
          <div className="xendit-channel-form-field-group-label-container">
            <label htmlFor="given_names" className="xendit-text-14">
              Name
            </label>
          </div>

          <div className="xendit-form-field-group">
            <div className="xendit-channel-form-field xendit-form-field-span-2">
              <input
                id="given_names"
                name="given_names"
                type="text"
                placeholder="Your Name"
                className="xendit-form-field-inner xendit-text-14"
                // onBlur={handleBlur}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </div>
          </div>
        </div>
      </form>
    );
  },
);
