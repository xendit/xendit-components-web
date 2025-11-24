import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { FieldProps } from "./field";
import { getCountries } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./dropdown";
import { formFieldName } from "../utils";
import { validate } from "../validation";
import { InternalInputValidateEvent } from "../private-event-types";
import { LocaleKey, LocalizedString } from "../localization";

type FlagIconProps = {
  countryCode: string;
  size?: number;
};

const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 16 }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundImage: `url(https://assets.xendit.co/payment-session/flags/circle/${countryCode.toLowerCase()}.svg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        flexShrink: 0,
      }}
    />
  );
};

export const CountryField: React.FC<FieldProps> = (props) => {
  const { field, onChange, onError } = props;
  const id = formFieldName(field);

  const hiddenFieldRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<LocaleKey | LocalizedString | null>(null);

  const validateField = useCallback(
    (value: string) => {
      const errorCode = validate(field, value) ?? null;
      console.log("CountryField validateField", { value, errorCode });
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
    <div className={error ? "invalid" : ""}>
      <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
      <Dropdown
        id={id}
        options={COUNTRIES_AS_DROPDOWN_OPTIONS}
        onChange={onChangeWrapper}
        placeholder={field.placeholder}
      />
    </div>
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
      leadingAsset: <FlagIcon countryCode={countryCode} />,
    } as DropdownOption;
  })
  .sort((a, b) => a.title.localeCompare(b.title));
