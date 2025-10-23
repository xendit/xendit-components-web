import { useCallback, useRef } from "preact/hooks";
import { FieldProps, formFieldName } from "./field";
import { getCountries } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./dropdown";
import { CircleFlag } from "react-circle-flags";

export const CountryField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const onChangeWrapper = useCallback(
    (option: DropdownOption) => {
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
