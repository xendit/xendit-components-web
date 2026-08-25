import { FieldProps } from "./field";
import { Dropdown, DropdownOption } from "./core/dropdown";
import type { CountryCode } from "libphonenumber-js";
import type { PhoneNumber } from "libphonenumber-js";
import {
  useCountriesAsDropdownOptions,
  useOnCardCountryChange,
} from "./field-country";
import { getLoadedLibphonenumber } from "../libphonenumber-loader";
import examples from "libphonenumber-js/mobile/examples";
import { useSession } from "./session-provider";
import { formFieldId, formFieldName } from "../utils";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FunctionComponent, TargetedEvent, TargetedFocusEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

type DropdownOptionWithDial = DropdownOption & { dial: string };

const sanitizePhoneNumber = (
  country: DropdownOptionWithDial,
  phoneNumber: string,
): PhoneNumber | null => {
  const lib = getLoadedLibphonenumber();
  if (!lib) return null;
  const parsed = lib.parsePhoneNumberFromString(
    phoneNumber,
    country.value as CountryCode,
  );
  if (parsed && parsed.isPossible()) return parsed;
  return null;
};

export const PhoneNumberField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  const session = useSession();

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const countriesAsDropdownOptions = useCountriesAsDropdownOptions();

  const isLibraryLoaded = countriesAsDropdownOptions.length > 0;

  const countriesWithDialCodesAsDropdownOptions = useMemo(() => {
    const lib = getLoadedLibphonenumber();
    if (!lib) return [];
    return countriesAsDropdownOptions
      .map<DropdownOptionWithDial | null>((country) => {
        const dial = lib.getCountryCallingCode(country.value as CountryCode);
        if (!dial) return null;
        return {
          ...country,
          shortTitle: `+${dial}`,
          title: `${country.title} (+${dial})`,
          dial,
        };
      })
      .filter((c): c is DropdownOptionWithDial => Boolean(c));
  }, [countriesAsDropdownOptions]);

  function initialValues(initial: string | undefined, sessionCountry: string) {
    const defaultInitial = {
      country: sessionCountry,
      localNumber: "",
    };
    if (!initial) return defaultInitial;
    const lib = getLoadedLibphonenumber();
    if (!lib) return defaultInitial;
    const parsed = lib.parsePhoneNumberFromString(initial);
    if (!parsed) return defaultInitial;
    const countryOption = countriesWithDialCodesAsDropdownOptions.find(
      (option) => option.value === parsed.country,
    );
    if (!countryOption) return defaultInitial;
    const sanitized = sanitizePhoneNumber(countryOption, parsed.nationalNumber);
    if (!sanitized) return defaultInitial;
    const international = parsed.formatInternational();
    const countryCode = lib.getCountryCallingCode(
      countryOption.value as CountryCode,
    );
    return {
      country: countryOption.value as string,
      localNumber: international.replace(`+${countryCode} `, ""),
    };
  }

  const initial = useMemo(
    () => initialValues(field.initial_value, session.country),
    [field.initial_value, session.country],
  );

  const [countryCode, setCountryCode] = useState(initial.country);
  const countryCodeIndex = useMemo(() => {
    const index = countriesWithDialCodesAsDropdownOptions.findIndex(
      (r) => r.value === countryCode,
    );
    if (index === -1) return 0;
    return index;
  }, [countryCode, countriesWithDialCodesAsDropdownOptions]);
  const country = countriesWithDialCodesAsDropdownOptions[countryCodeIndex];

  const [localNumber, setLocalNumber] = useState(initial.localNumber);
  const inputRef = useRef<HTMLInputElement>(null);

  // re-sync display once the library finishes loading
  useEffect(() => {
    if (!isLibraryLoaded || !field.initial_value) return;
    const recomputed = initialValues(field.initial_value, session.country);
    setCountryCode(recomputed.country);
    setLocalNumber(recomputed.localNumber);
  }, [isLibraryLoaded]);

  const formatPhoneNumber = useCallback(
    (country: DropdownOptionWithDial, localNumber: string) => {
      const phoneNumber = sanitizePhoneNumber(country, localNumber);
      if (phoneNumber) {
        return phoneNumber.number;
      } else {
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
    if (country) updateHiddenField(country, nextLocal);
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
    const newOption = countriesWithDialCodesAsDropdownOptions.find(
      (option) => option.value === newCountry,
    );
    if (newOption && newOption.value !== countryCode && !localNumber) {
      handleCountryChange(newOption);
    }
  });

  function getExampleLocalNumber() {
    const lib = getLoadedLibphonenumber();
    if (!lib || !country) return "";
    return (
      lib
        .getExampleNumber(country.value as CountryCode, examples)
        ?.formatInternational()
        ?.replace(
          `+${lib.getCountryCallingCode(country.value as CountryCode)} `,
          "",
        ) || ""
    );
  }

  function formatForUser(_country = country, _localNumber = localNumber) {
    const lib = getLoadedLibphonenumber();
    if (!lib || !_country) return;
    const phoneNumber = sanitizePhoneNumber(_country, _localNumber);
    if (phoneNumber) {
      // sync the dropdown if the number is from a different country
      if (phoneNumber.country && phoneNumber.country !== _country.value) {
        const matchedCountry = countriesWithDialCodesAsDropdownOptions.find(
          (option) => option.value === phoneNumber.country,
        );
        if (matchedCountry) {
          setCountryCode(matchedCountry.value as string);
          _country = matchedCountry;
        }
      }
      const international = phoneNumber.formatInternational();
      // remove country dial code from displayed local number
      setLocalNumber(
        international.replace(
          `+${lib.getCountryCallingCode(_country.value as CountryCode)} `,
          "",
        ),
      );
    }
  }

  // wait for the library so validation never runs against an unparsed value;
  // useLayoutEffect keeps this synchronous once isLibraryLoaded is already true
  useLayoutEffect(() => {
    if (!isLibraryLoaded) return;
    if (field.initial_value) {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = field.initial_value;
      }
      onChange(true);
    }
  }, [isLibraryLoaded]);

  return (
    <div className="xendit-input-phone">
      <Dropdown
        options={countriesWithDialCodesAsDropdownOptions}
        selectedIndex={countryCodeIndex}
        onChange={handleCountryChange}
        fixedOverlayWidth={300}
        enableSearch
        noOverflow
        className="xendit-form-field-inner"
        disabled={!isLibraryLoaded}
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
        disabled={!isLibraryLoaded}
      />
      <input type="hidden" name={name} ref={hiddenFieldRef} />
    </div>
  );
};
