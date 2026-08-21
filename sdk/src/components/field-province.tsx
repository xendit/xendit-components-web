import {
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "preact/hooks";
import { FieldProps } from "./field";
import { CountryCode } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./core/dropdown";
import { VISUALLY_HIDDEN } from "./field-country";
import { useSession } from "./session-provider";
import { PROVINCES_CA, PROVINCES_GB, PROVINCES_US } from "../data/provinces";
import {
  formFieldId,
  formFieldName,
  getValueFromChannelProperty,
  objectId,
  usePrevious,
} from "../utils";
import { useChannel } from "./channel-root";
import { useChannelProperties } from "./channel-form";
import { ChannelFormField, ChannelProperties } from "../backend-types/channel";
import { BffSession } from "../backend-types/session";
import { FunctionComponent, TargetedEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const ProvinceField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  const session = useSession();
  const allFields = useChannel()?.form;
  const channelProperties = useChannelProperties();

  const [value, setValue] = useState(field.initial_value as string);

  // carries a `<select>` or `<input>` depending on mode, so a callback ref is used since one ref object can't be typed to both.
  const valueFieldRef = useRef<HTMLInputElement | HTMLSelectElement | null>(
    null,
  );
  const setFieldRef = useCallback(
    (element: HTMLInputElement | HTMLSelectElement | null) => {
      valueFieldRef.current = element;
    },
    [],
  );

  const clearValue = useCallback(() => {
    setValue("");
    if (valueFieldRef.current) {
      valueFieldRef.current.value = "";
    }
    onChange();
  }, [onChange]);

  const onChangeDropdown = useCallback(
    (option: DropdownOption) => {
      setValue(option.value);
      if (valueFieldRef.current) {
        valueFieldRef.current.value = option.value;
      }
      onChange();
      valueFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    },
    [onChange],
  );

  const onChangeInput = useCallback(
    (e: TargetedEvent<HTMLInputElement>) => {
      setValue(e.currentTarget.value);
      if (valueFieldRef.current) {
        valueFieldRef.current.value = (e.target as HTMLInputElement).value;
      }
      onChange();
      valueFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    },
    [onChange],
  );

  // get the list of provinces for the chosen country
  const options = getProvinceList(
    getBestCountryForProvinceField(
      field,
      allFields ?? [],
      channelProperties ?? {},
      session,
    ),
  );
  const selectedOptionIndex = options
    ? options.findIndex((option) => option.value === value)
    : -1;

  // rebuild only when the province list changes
  const selectOptions = useMemo(
    () =>
      options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.title}
        </option>
      )),
    [options],
  );

  const handleNativeSelectChange = useCallback(
    (event: TargetedEvent<HTMLSelectElement>) => {
      const filledValue = event.currentTarget.value;

      if (!filledValue) {
        // browser cleared the field, so clear our copy too
        clearValue();
        return;
      }

      const option = options?.find((o) => o.value === filledValue);
      if (option) {
        onChangeDropdown(option);
      } else if (valueFieldRef.current) {
        // not a province we offer, keep our value so the UI and the form agree
        valueFieldRef.current.value = value ?? "";
      }
    },
    [options, onChangeDropdown, clearValue, value],
  );

  // if the options list changes, clear the value,
  // but not on first render,
  // or if the current value happens to be a valid option in the new list
  const previousOptions = usePrevious(options);
  const didRenderOnce = useRef(false);
  useLayoutEffect(() => {
    if (!didRenderOnce.current) {
      didRenderOnce.current = true;
      return;
    }

    // if options list changes, clear the selected value
    if (options !== previousOptions) {
      if (selectedOptionIndex !== -1) {
        if (valueFieldRef.current) {
          valueFieldRef.current.value = value;
        }
        return;
      }
      clearValue();
    }
  }, [clearValue, options, previousOptions, selectedOptionIndex, value]);

  // on first render, populate hidden field and notify parent of initial value
  useLayoutEffect(() => {
    if (field.initial_value) {
      if (valueFieldRef.current) {
        valueFieldRef.current.value = value;
      }
      onChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {options ? (
        <>
          {/* a `<select>`, not `type="hidden"` browsers only autofill what they render */}
          <select
            name={name}
            ref={setFieldRef}
            autoComplete="address-level1"
            onChange={handleNativeSelectChange}
            style={VISUALLY_HIDDEN}
            tabIndex={-1}
          >
            <option value="" />
            {selectOptions}
          </select>
          <Dropdown
            key={objectId(options)}
            id={id}
            options={options}
            selectedIndex={selectedOptionIndex}
            onChange={onChangeDropdown}
            placeholder={field.placeholder}
            enableSearch
            className="xendit-form-field-inner"
          />
        </>
      ) : (
        <input
          type="text"
          id={id}
          name={name}
          ref={setFieldRef}
          value={value}
          onChange={onChangeInput}
          placeholder={field.placeholder}
          className={`xendit-form-field-inner xendit-text-14`}
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

function getBestCountryForProvinceField(
  thisField: ChannelFormField,
  allFields: ChannelFormField[],
  channelProperties: ChannelProperties,
  session: BffSession,
): CountryCode {
  // country selection priority:
  // 1. previous form field
  // 3. session country
  if (allFields) {
    for (let i = 0; i < allFields.length; i++) {
      const otherField = allFields[i];
      if (i > 0 && otherField === thisField) {
        const previousField = allFields[i - 1];
        if (previousField.type.name === "country") {
          const country = getValueFromChannelProperty(
            previousField.channel_property,
            channelProperties,
          );
          if (country && typeof country === "string") {
            return country as CountryCode;
          }
        }
      }
    }
  }
  return session.country as CountryCode;
}
