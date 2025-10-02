import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldProps, formFieldName } from "./field";
import { validate } from "../validation";
import { InputInvalidEvent, InputValidateEvent } from "../public-event-types";
import { Dropdown } from "./dropdown";
import { CircleFlag } from "react-circle-flags";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/min";

type CountryRow = {
  iso2: string; // e.g., 'ID'
  dial: string; // e.g., '+62'
  label: string; // e.g., 'Indonesia'
};

// Thin adapter to map country codes -> Dropdown options
const CountryCodeDropdown: React.FC<{
  dialValue: string; // current selected dial (e.g., '+84')
  onDialChange: (nextDialCode: string) => void; // callback when user selects new dial
  id: string;
  label?: string;
  placeholder?: string;
}> = ({ dialValue, onDialChange, id, placeholder = "Select" }) => {
  const rows = useMemo<CountryRow[]>(() => {
    return (
      getCountries()
        .map((countryCode) => {
          try {
            const callingCode = getCountryCallingCode(countryCode);
            const country = new Intl.DisplayNames(["en"], {
              type: "region",
            }).of(countryCode);

            if (!callingCode || !country) return null;

            return {
              iso2: countryCode,
              dial: callingCode,
              label: country,
            } as CountryRow;
          } catch {
            //Country not supported
            return null;
          }
        })
        .filter(Boolean) as CountryRow[]
    ).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const options = useMemo(
    () =>
      rows.map((r) => ({
        leadingAsset: (
          <CircleFlag
            countryCode={r.iso2.toLowerCase()}
            width={16}
            height={16}
          />
        ),
        title: `${r.label} (+${r.dial})`,
      })),
    [rows],
  );

  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        rows.findIndex((r) => r.dial === dialValue),
      ),
    [rows, dialValue],
  );

  return (
    <Dropdown
      id={id}
      placeholder={placeholder}
      options={options}
      selectedIndex={selectedIndex}
      onChange={(_, idx) => {
        const row = rows[idx];
        if (row) onDialChange(row.dial);
      }}
    />
  );
};

export const PhoneNumberField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  const [dialCode, setDialCode] = useState("62"); // default to Indonesia
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
  const fullValue = formatPhoneNumber(dialCode, localNumber);

  function handleLocalChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const nextLocal = (event.target as HTMLInputElement).value;
    setLocalNumber(nextLocal);
    onChange(); // keep parity with other fields
    if (!isTouched) return;
    validateField(formatPhoneNumber(dialCode, nextLocal));
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) validateField(formatPhoneNumber(dialCode, value));
  }

  // Hook your custom validation event into the composed value
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
        <CountryCodeDropdown
          id={`${id}-country`}
          dialValue={dialCode}
          onDialChange={(code) => setDialCode(code)}
        />

        <input
          id={id}
          name={id}
          ref={inputRef}
          type="tel"
          inputMode="tel"
          placeholder={dialCode ? `+${dialCode}` : ""}
          className="xendit-text-14 xendit-phone-number-input"
          onBlur={handleBlur}
          onChange={handleLocalChange}
          value={localNumber}
          autoComplete="tel"
        />
      </div>

      {/* Hidden canonical value (useful for non-JS form posts) */}
      <input type="hidden" value={fullValue} />

      {error && (
        <span className="xendit-error-message xendit-text-14">{error}</span>
      )}
    </div>
  );
};
