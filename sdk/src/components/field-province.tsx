import { useRef, useCallback, useLayoutEffect, useState } from "preact/hooks";
import { FieldProps } from "./field";
import { CountryCode } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./core/dropdown";
import { useSession } from "./session-provider";
import { PROVINCES_CA, PROVINCES_GB, PROVINCES_US } from "../data/provinces";
import { formFieldId, formFieldName, objectId, usePrevious } from "../utils";
import { useChannel } from "./channel-root";
import { useChannelProperties } from "./channel-form";
import { ChannelFormField, ChannelProperties } from "../backend-types/channel";
import { BffSession } from "../backend-types/session";
import { FunctionComponent, TargetedEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";
import { getValueFromChannelProperty } from "../utils-channel-properties";

export const ProvinceField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);

  const session = useSession();
  const allFields = useChannel()?.form;
  const channelProperties = useChannelProperties();

  const [value, setValue] = useState(field.initial_value as string);

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const clearValue = useCallback(() => {
    setValue("");
    if (hiddenFieldRef.current) {
      hiddenFieldRef.current.value = "";
    }
    onChange();
  }, [onChange]);

  const onChangeDropdown = useCallback(
    (option: DropdownOption) => {
      setValue(option.value);
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = option.value;
      }
      onChange();
      hiddenFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    },
    [onChange],
  );

  const onChangeInput = useCallback(
    (e: TargetedEvent<HTMLInputElement>) => {
      setValue(e.currentTarget.value);
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = (e.target as HTMLInputElement).value;
      }
      onChange();
      hiddenFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
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
      if (selectedOptionIndex !== -1) return; // ok, this is still valid
      clearValue();
    }
  }, [clearValue, options, previousOptions, selectedOptionIndex]);

  // on first render, populate hidden field and notify parent of initial value
  useLayoutEffect(() => {
    if (field.initial_value) {
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = value;
      }
      onChange(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <input type="hidden" name={name} defaultValue="" ref={hiddenFieldRef} />
      {options ? (
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
      ) : (
        <input
          type="text"
          id={id}
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
