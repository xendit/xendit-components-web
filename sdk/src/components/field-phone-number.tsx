import { useCallback, useMemo, useRef, useState } from "react";
import { FieldProps } from "./field";
import { validate } from "../validation";
import { Dropdown, DropdownOption } from "./dropdown";
import { CountryCode, getCountryCallingCode } from "libphonenumber-js/min";
import { COUNTRIES_AS_DROPDOWN_OPTIONS } from "./field-country";
import parsePhoneNumberFromString, {
  getExampleNumber,
  PhoneNumber,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { useSession } from "./session-provider";
import { formFieldName } from "../utils";

export const PhoneNumberField: React.FC<FieldProps> = (props) => {
  const { field, onChange, onError } = props;
  const id = formFieldName(field);

  const session = useSession();

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

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
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = useCallback(
    (country: DropdownOptionWithDial, localNumber: string) => {
      const phoneNumber = sanitizePhoneNumber(country, localNumber);
      if (phoneNumber) {
        // use parsed format if parsing was successful
        return phoneNumber.number;
      } else {
        // else just concat the dial code and local number
        return `+${country.dial}${localNumber}`;
      }
    },
    [],
  );

  const updateValidity = useCallback(
    (nextCountry: DropdownOptionWithDial, localNumber: string) => {
      const phoneNumberString = formatPhoneNumber(nextCountry, localNumber);
      const errorCode = validate(field, phoneNumberString) ?? null;
      if (onError) onError(id, errorCode);
      setHasError(errorCode !== null);
    },
    [field, formatPhoneNumber, id, onError],
  );

  const updateHiddenField = useCallback(
    (country: DropdownOptionWithDial, localNumber: string) => {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = formatPhoneNumber(country, localNumber);
      }
    },
    [formatPhoneNumber],
  );

  function handleLocalChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const nextLocal = (event.target as HTMLInputElement).value;
    setLocalNumber(nextLocal);
    updateHiddenField(country, nextLocal);
    updateValidity(country, nextLocal);
    onChange(); // keep parity with other fields
  }

  function handleCountryChange(option: DropdownOption): void {
    const nextCountry = option as DropdownOptionWithDial;
    setCountryCode(nextCountry.value as string);
    updateHiddenField(nextCountry, localNumber);
    updateValidity(nextCountry, localNumber);
    onChange(); // keep parity with other fields
  }

  function getExampleLocalNumber() {
    return (
      getExampleNumber(country.value as CountryCode, examples)
        ?.formatInternational()
        ?.replace(
          `+${getCountryCallingCode(country.value as CountryCode)} `,
          "",
        ) || ""
    );
  }

  function formatForUser() {
    const phoneNumber = sanitizePhoneNumber(country, localNumber);
    if (phoneNumber) {
      const international = phoneNumber.formatInternational();
      // remove country dial code from displayed local number
      setLocalNumber(
        international.replace(
          `+${getCountryCallingCode(country.value as CountryCode)} `,
          "",
        ),
      );
    }
  }

  function handleBlur(): void {
    formatForUser();
  }

  return (
    <div className={`xendit-input-phone ${hasError ? "invalid" : ""}`}>
      <div className="xendit-combobox">
        <Dropdown
          options={COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS}
          selectedIndex={countryCodeIndex}
          onChange={handleCountryChange}
        />
        <input
          id={id}
          ref={inputRef}
          type="tel"
          inputMode="tel"
          placeholder={getExampleLocalNumber()}
          className="xendit-text-14 xendit-phone-number-input"
          onBlur={handleBlur}
          onChange={handleLocalChange}
          value={localNumber}
          autoComplete="tel"
        />
      </div>

      {/* Hidden canonical value (useful for non-JS form posts) */}
      <input type="hidden" name={id} ref={hiddenFieldRef} />
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

const sanitizePhoneNumber = (
  country: DropdownOptionWithDial,
  phoneNumber: string,
): PhoneNumber | null => {
  const parsed = parsePhoneNumberFromString(
    phoneNumber,
    country.value as CountryCode,
  );
  if (parsed && parsed.isPossible()) return parsed;

  return null;
};
