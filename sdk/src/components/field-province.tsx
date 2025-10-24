import { useCallback, useMemo, useRef } from "preact/hooks";
import { FieldProps, formFieldName } from "./field";
import { CountryCode } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./dropdown";
import { useSession } from "./session-provider";
import { PROVINCES_CA, PROVINCES_GB, PROVINCES_US } from "../data/provinces";

export const ProvinceField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  const session = useSession();

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const onChangeDropdown = useCallback(
    (option: DropdownOption) => {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = option.value;
      }
      onChange();
    },
    [onChange],
  );

  const onChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = (e.target as HTMLInputElement).value;
      }
      onChange();
    },
    [onChange],
  );

  const options = useMemo(() => {
    // TODO: country selection priority:
    // 1. previous form field
    // 2. card data country
    // 3. session country
    return (
      getProvinceList(session.country as CountryCode)?.map((country) => ({
        title: country.name,
        value: country.value,
      })) ?? null
    );
  }, [session.country]);

  return (
    <>
      <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
      {options ? (
        <Dropdown
          id={id}
          options={options}
          onChange={onChangeDropdown}
          placeholder={field.placeholder}
        />
      ) : (
        <input
          type="text"
          id={id}
          onChange={onChangeInput}
          placeholder={field.placeholder}
          className="xendit-input xendit-text-14"
        />
      )}
    </>
  );
};

function getProvinceList(country: CountryCode | null) {
  switch (country) {
    case "US":
      return PROVINCES_US;
    case "CA":
      return PROVINCES_CA;
    case "GB":
      return PROVINCES_GB;
    default:
      return null;
  }
}
