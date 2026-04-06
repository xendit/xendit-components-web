import { forwardRef, useImperativeHandle, useState } from "preact/compat";
import { CustomerDetails } from "../backend-types/customer";
import { getLocalizedErrorMessage } from "../localization";
import { validateCustomerDetails } from "../validation";
import { useSdk } from "./session-provider";

type Props = {
  onChange: (customerDetails: CustomerDetails) => void;
  value: CustomerDetails;
};
export interface CustomerDetailsFormHandle {
  setAllFieldsTouched: () => void;
}

export const CustomerForm = forwardRef<CustomerDetailsFormHandle, Props>(
  ({ onChange, value }, ref) => {
    const { t } = useSdk();
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleBlur = (e: Event) => {
      const target = e.target as HTMLInputElement;
      setTouched((prev) => ({ ...prev, [target.name]: true }));
    };

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      onChange({ given_names: target.value });
    };

    useImperativeHandle(ref, () => ({
      setAllFieldsTouched() {
        setTouched({ given_names: true });
      },
    }));

    const renderError = () => {
      if (Object.keys(touched).length === 0) {
        return null;
      }

      const err = validateCustomerDetails(value);
      if (!err) {
        return null;
      }

      return (
        <span className="xendit-error-message xendit-text-12">
          {getLocalizedErrorMessage(t, err, "Name")}
        </span>
      );
    };

    const error = renderError();

    return (
      <form>
        <div className="xendit-channel-form-field-group">
          <div className="xendit-channel-form-field-group-label-container">
            <label htmlFor="given_names" className="xendit-text-14">
              Name
            </label>
          </div>

          <div className={`xendit-form-field-group ${error ? "invalid" : ""}`}>
            <div className="xendit-channel-form-field xendit-form-field-span-2">
              <input
                id="given_names"
                name="given_names"
                type="text"
                placeholder="Your Name"
                className="xendit-form-field-inner xendit-text-14"
                onBlur={handleBlur}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </div>
          </div>

          {error}
        </div>
      </form>
    );
  },
);
