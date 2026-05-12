import { FieldProps } from "./field";
import { Dropdown, DropdownOption } from "./core/dropdown";
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
import { formFieldId, formFieldName } from "../utils";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FunctionComponent, TargetedEvent, TargetedFocusEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const PhoneNumberField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  const session = useSession();

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(
    () => initialValues(field.initial_value, session.country),
    [field.initial_value, session.country],
  );

  const [countryCode, setCountryCode] = useState(initial.country);
  const countryCodeIndex = useMemo(() => {
    const index = COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS.findIndex(
      (r) => r.value === countryCode,
    );
    if (index === -1) return 0;
    return index;
  }, [countryCode]);
  const country =
    COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS[countryCodeIndex];

  const [localNumber, setLocalNumber] = useState(initial.localNumber);
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
      hiddenFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
  }

  // when the user inputs a card number, update the phone number field to match
  useOnCardCountryChange((newCountry: CountryCode) => {
    const newOption = COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS.find(
      (option) => option.value === newCountry,
    );
    if (newOption && newOption.value !== countryCode && !localNumber) {
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

  function formatForUser(_country = country, _localNumber = localNumber) {
    const phoneNumber = sanitizePhoneNumber(_country, _localNumber);
    if (phoneNumber) {
      const international = phoneNumber.formatInternational();
      // remove country dial code from displayed local number
      setLocalNumber(
        international.replace(
          `+${getCountryCallingCode(_country.value as CountryCode)} `,
          "",
        ),
      );
    }
  }

  // on first render, populate hidden input and notify parent component of initial value
  useLayoutEffect(() => {
    if (field.initial_value) {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = field.initial_value;
      }
      onChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="xendit-input-phone">
      <Dropdown
        options={COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS}
        selectedIndex={countryCodeIndex}
        onChange={handleCountryChange}
        fixedOverlayWidth={300}
        enableSearch
        className="xendit-form-field-inner"
      />
      <input
        id={id}
        ref={inputRef}
        type="tel"
        inputMode="tel"
        placeholder={getExampleLocalNumber()}
        className="xendit-text-14 xendit-form-field-inner xendit-phone-number-input"
        onBlur={handleBlur}
        onChange={handleLocalChange}
        value={localNumber}
        autoComplete="tel"
      />
      <input type="hidden" name={name} ref={hiddenFieldRef} />
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

function initialValues(initial: string | undefined, sessionCountry: string) {
  const defaultInitial = {
    country: sessionCountry,
    localNumber: "",
  };
  if (!initial) return defaultInitial;
  const parsed = parsePhoneNumberFromString(initial);
  if (!parsed) return defaultInitial;
  const countryOption = COUNTRIES_WITH_DIAL_CODES_AS_DROPDOWN_OPTIONS.find(
    (option) => option.value === parsed.country,
  );
  if (!countryOption) return defaultInitial;
  const sanitized = sanitizePhoneNumber(countryOption, parsed.nationalNumber);
  if (!sanitized) return defaultInitial;
  const international = parsed.formatInternational();
  const countryCode = getCountryCallingCode(countryOption.value as CountryCode);
  return {
    country: countryOption.value as string,
    localNumber: international.replace(`+${countryCode} `, ""),
  };
}
