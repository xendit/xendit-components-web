import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldProps, formFieldName } from "./field";
import { validate } from "../validation";
import { InputInvalidEvent, InputValidateEvent } from "../public-event-types";
import { Dropdown, DropdownOption } from "./dropdown";
import { CountryCode, getCountryCallingCode } from "libphonenumber-js/min";
import { COUNTRIES_AS_DROPDOWN_OPTIONS } from "./field-country";
import { getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { useSession } from "./session-provider";

export const PhoneNumberField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  const session = useSession();

  const [countryCode, setCountryCode] = useState(session.country);
  const countryCodeIndex = useMemo(() => {
    const index = COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS.findIndex(
      (r) => r.value === countryCode,
    );
    if (index === -1) return 0;
    return index;
  }, [countryCode]);
  const country =
    COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS[countryCodeIndex];

  const [localNumber, setLocalNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateField = useCallback(
    (value: string) => {
      const errorMessage = validate(field, value) ?? null;
      setError(errorMessage);
      setIsTouched(true);
      return errorMessage;
    },
    [field],
  );

  const formatPhoneNumber = (dialCode: string, phoneNumber: string): string => {
    if (phoneNumber.length === 0) return "";
    return `+${dialCode}${phoneNumber.replace(/\D/g, "")}`;
  };

  // Compose the value shown to validation / submission
  const fullValue = formatPhoneNumber(country.dial, localNumber);

  function handleLocalChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const nextLocal = (event.target as HTMLInputElement).value;
    setLocalNumber(nextLocal);
    onChange(); // keep parity with other fields
    if (!isTouched) return;
    validateField(formatPhoneNumber(country.dial, nextLocal));
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) validateField(formatPhoneNumber(country.dial, value));
  }

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const listener = (e: Event) => {
      const value = (e as InputValidateEvent).detail.value as string;
      const errorMessage = validateField(value);
      if (errorMessage) input.dispatchEvent(new InputInvalidEvent());
    };
    input.addEventListener(InputValidateEvent.type, listener);
    return () => {
      input.removeEventListener(InputValidateEvent.type, listener);
    };
  }, [id, validateField]);

  return (
    <div className={`xendit-input-phone ${error?.length ? "invalid" : ""}`}>
      <div className="xendit-combobox">
        <Dropdown
          id={id}
          options={COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS}
          selectedIndex={countryCodeIndex}
          onChange={(option) => setCountryCode(option.value)}
        />
        <input
          id={id}
          ref={inputRef}
          type="tel"
          inputMode="tel"
          placeholder={getExampleNumber(
            country.value as CountryCode,
            examples,
          )?.formatInternational()}
          className="xendit-text-14 xendit-phone-number-input"
          onBlur={handleBlur}
          onChange={handleLocalChange}
          value={localNumber}
          autoComplete="tel"
        />
      </div>

      {/* Hidden canonical value (useful for non-JS form posts) */}
      <input type="hidden" name={id} value={fullValue} />

      {error && (
        <span className="xendit-error-message xendit-text-14">{error}</span>
      )}
    </div>
  );
};

type DropdownOptionWithDial = DropdownOption & { dial: string };
const COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS =
  COUNTRIES_AS_DROPDOWN_OPTIONS.map<DropdownOptionWithDial | null>(
    (country) => {
      const dial = getCountryCallingCode(country.value as CountryCode);
      if (!dial) return null;
      return {
        ...country,
        title: `${country.title} (+${dial})`,
        dial,
      };
    },
  ).filter((country): country is DropdownOptionWithDial => {
    return Boolean(country);
  });
