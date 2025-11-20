import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FieldProps } from "./field";
import { CountryCode } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./dropdown";
import { useSession } from "./session-provider";
import { PROVINCES_CA, PROVINCES_GB, PROVINCES_US } from "../data/provinces";
import { formFieldName } from "../utils";
import { validate } from "../validation";
import { InternalInputValidateEvent } from "../private-event-types";
import { LocaleKey, LocalizedString } from "../localization";

export const ProvinceField: React.FC<FieldProps> = (props) => {
  const { field, onChange, onError } = props;
  const id = formFieldName(field);

  const session = useSession();

  const hiddenFieldRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<LocaleKey | LocalizedString | null>(null);

  const validateField = useCallback(
    (value: string) => {
      const errorCode = validate(field, value) ?? null;
      if (onError) onError(id, errorCode);
      setError(errorCode);
      return errorCode;
    },
    [field, id, onError],
  );

  useEffect(() => {
    const input = hiddenFieldRef.current;
    if (!input) return;
    const listener = (e: Event) => {
      const value = (e as CustomEvent).detail.value;
      validateField(value);
    };
    input.addEventListener(InternalInputValidateEvent.type, listener);
    return () => {
      input.removeEventListener(InternalInputValidateEvent.type, listener);
    };
  }, [id, validateField]);

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
    return getProvinceList(session.country as CountryCode)?.map((country) => ({
      title: country.name,
      value: country.value,
    }));
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
          className={`xendit-input xendit-text-14 ${error ? "invalid" : ""}`}
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
