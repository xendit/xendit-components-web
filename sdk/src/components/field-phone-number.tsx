import { FieldProps } from "./field";
import { Dropdown, DropdownOption } from "./dropdown";
import { CountryCode, getCountryCallingCode } from "libphonenumber-js/min";
import {
  COUNTRIES_AS_DROPDOWN_OPTIONS,
  useOnCardCountryChange,
} from "./field-country";
import parsePhoneNumberFromString, {
  getExampleNumber,
  PhoneNumber,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { useSession } from "./session-provider";
import { formFieldName } from "../utils";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { FunctionComponent, TargetedEvent, TargetedFocusEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const PhoneNumberField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
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

  const updateHiddenField = useCallback(
    (country: DropdownOptionWithDial, localNumber: string) => {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = formatPhoneNumber(country, localNumber);
      }
    },
    [formatPhoneNumber],
  );

  function handleLocalChange(event: TargetedEvent<HTMLInputElement>): void {
    const nextLocal = (event.target as HTMLInputElement).value;
    setLocalNumber(nextLocal);
    updateHiddenField(country, nextLocal);
    onChange();
  }

  function handleCountryChange(option: DropdownOption): void {
    const nextCountry = option as DropdownOptionWithDial;
    setCountryCode(nextCountry.value as string);
    updateHiddenField(nextCountry, localNumber);
    onChange();
  }

  function handleBlur(event: TargetedFocusEvent<HTMLInputElement>): void {
    formatForUser();
    if (event.currentTarget?.value) {
      inputRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
  }

  // when the user inputs a card number, update the phone number field to match
  useOnCardCountryChange((newCountry: CountryCode) => {
    const newOption = COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS.find(
      (option) => option.value === newCountry,
    );
    if (newOption && newOption.value !== countryCode) {
      handleCountryChange(newOption);
    }
  });

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

  return (
    <div className={`xendit-input-phone`}>
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
        shortTitle: `+${dial}`,
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
