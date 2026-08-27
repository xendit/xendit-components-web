import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FieldProps } from "./field";
import type { CountryCode } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./core/dropdown";
import { getLoadedLibphonenumber } from "../libphonenumber-loader";
import { formFieldId, formFieldName, usePrevious } from "../utils";
import { FunctionComponent, TargetedEvent } from "preact";
import { useChannelComponentData } from "./channel-root";

type FlagIconProps = {
  countryCode: string;
  size?: number;
};

const FlagIcon: FunctionComponent<FlagIconProps> = ({
  countryCode,
  size = 16,
}) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundImage: `url(https://assets.xendit.co/payment-session/flags/circle/${countryCode.toLowerCase()}.svg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
};

// the country list never changes
export function useCountriesAsDropdownOptions(): DropdownOption[] {
  return useMemo(
    () =>
      getLoadedLibphonenumber()!
        .getCountries()
        .map((countryCode) => {
          const country = new Intl.DisplayNames(["en"], {
            type: "region",
          }).of(countryCode);

          return {
            title: country,
            value: countryCode,
            leadingAsset: <FlagIcon countryCode={countryCode} />,
          } as DropdownOption;
        })
        .sort((a, b) => a.title.localeCompare(b.title)),
    [],
  );
}

export const CountryField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  const countriesAsDropdownOptions = useCountriesAsDropdownOptions();

  const [selectedCountry, setSelectedCountry] = useState<
    CountryCode | undefined
  >(field.initial_value as CountryCode | undefined);

  const selectedCountryIndex = countriesAsDropdownOptions.findIndex(
    (option) => option.value === selectedCountry,
  );

  const hiddenFieldRef = useRef<HTMLSelectElement>(null);

  useOnCardCountryChange((newCountry: CountryCode) => {
    if (hiddenFieldRef.current) {
      const newOption = countriesAsDropdownOptions.find((option) => {
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

  // on first render populate hidden field with initial value and notify parent of change
  useLayoutEffect(() => {
    if (field.initial_value) {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = selectedCountry || "";
      }
      onChange(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNativeSelectChange = useCallback(
    (event: TargetedEvent<HTMLSelectElement>) => {
      const filledValue = event.currentTarget.value;

      if (!filledValue) {
        // browser cleared the field, so clear our copy too
        setSelectedCountry(undefined);
        onChange();
        return;
      }

      const option = countriesAsDropdownOptions.find(
        (o) => o.value === filledValue,
      );
      if (option) {
        onChangeWrapper(option);
      } else if (hiddenFieldRef.current) {
        // not a country we offer
        hiddenFieldRef.current.value = selectedCountry ?? "";
      }
    },
    [onChange, onChangeWrapper, selectedCountry, countriesAsDropdownOptions],
  );

  const selectOptions = useMemo(
    () =>
      countriesAsDropdownOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.title}
        </option>
      )),
    [countriesAsDropdownOptions],
  );

  return (
    <div>
      {/* a `<select>`, not `type="hidden"` browsers only autofill what they render */}
      <select
        name={name}
        ref={hiddenFieldRef}
        autoComplete="country"
        onChange={handleNativeSelectChange}
        style={VISUALLY_HIDDEN}
        tabIndex={-1}
      >
        <option value="" />
        {selectOptions}
      </select>
      <Dropdown
        id={id}
        options={countriesAsDropdownOptions}
        onChange={onChangeWrapper}
        placeholder={field.placeholder}
        selectedIndex={selectedCountryIndex}
        enableSearch
        className="xendit-form-field-inner"
      />
    </div>
  );
};

/** Hidden from sight but still rendered, so browser autofill can reach it. */
export const VISUALLY_HIDDEN = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "0",
  padding: "0",
  border: "0",
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

export function useOnCardCountryChange(fn: (newCountry: CountryCode) => void) {
  const cardDetails = useChannelComponentData()?.cardDetails;
  const cardDetailsCountry = cardDetails?.details?.country_codes[0];

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
