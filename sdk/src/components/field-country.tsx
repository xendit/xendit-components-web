import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";
import { FieldProps } from "./field";
import { CountryCode, getCountries } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./dropdown";
import { CircleFlag } from "react-circle-flags";
import { formFieldName, usePrevious } from "../utils";
import { useCardDetails } from "./session-provider";

export const CountryField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  const [selectedCountry, setSelectedCountry] = useState<
    CountryCode | undefined
  >(undefined);
  const selectedCountryIndex = COUNTRIES_AS_DROPDOWN_OPTIONS.findIndex(
    (option) => option.value === selectedCountry,
  );

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  useOnCardCountryChange((newCountry: CountryCode) => {
    if (hiddenFieldRef.current) {
      const newOption = COUNTRIES_AS_DROPDOWN_OPTIONS.find((option) => {
        return option.value === newCountry;
      });
      if (newOption) onChangeWrapper(newOption);
    }
  });

  const onChangeWrapper = useCallback(
    (option: DropdownOption) => {
      setSelectedCountry(option.value as CountryCode);
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = option.value;
      }
      onChange();
    },
    [onChange],
  );

  return (
    <>
      <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
      <Dropdown
        id={id}
        options={COUNTRIES_AS_DROPDOWN_OPTIONS}
        onChange={onChangeWrapper}
        placeholder={field.placeholder}
        selectedIndex={selectedCountryIndex}
      />
    </>
  );
};

export const COUNTRIES_AS_DROPDOWN_OPTIONS = getCountries()
  .map((countryCode) => {
    const country = new Intl.DisplayNames(["en"], {
      type: "region",
    }).of(countryCode);

    return {
      title: country,
      value: countryCode,
      leadingAsset: (
        <CircleFlag
          key={countryCode}
          countryCode={countryCode.toLowerCase()}
          width={16}
          height={16}
          cdnUrl={`https://assets.xendit.co/payment-session/flags/circle/`}
        />
      ),
    } as DropdownOption;
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export function useOnCardCountryChange(fn: (newCountry: CountryCode) => void) {
  const cardDetails = useCardDetails();
  const cardDetailsCountry = cardDetails.details?.country_codes[0];

  // if card details changes, set country to card's country
  const previousCardDetailsCountry = usePrevious(cardDetailsCountry);
  useLayoutEffect(() => {
    if (
      cardDetailsCountry &&
      cardDetailsCountry !== previousCardDetailsCountry
    ) {
      fn(cardDetailsCountry as CountryCode);
    }
  });
}
