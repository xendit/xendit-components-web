import { useRef, useCallback, useLayoutEffect } from "preact/hooks";
import { FieldProps } from "./field";
import { CountryCode } from "libphonenumber-js";
import { Dropdown, DropdownOption } from "./dropdown";
import { useSession } from "./session-provider";
import { PROVINCES_CA, PROVINCES_GB, PROVINCES_US } from "../data/provinces";
import {
  formFieldName,
  getValueFromChannelProperty,
  objectId,
  usePrevious,
} from "../utils";
import { useChannel } from "./payment-channel";
import { useChannelProperties } from "./channel-form";
import { ChannelFormField, ChannelProperties } from "../backend-types/channel";
import { BffSession } from "../backend-types/session";
import { FunctionComponent, TargetedEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const ProvinceField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);

  const session = useSession();
  const allFields = useChannel()?.form;
  const channelProperties = useChannelProperties();

  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const clearValue = useCallback(() => {
    if (hiddenFieldRef.current) {
      hiddenFieldRef.current.value = "";
    }
    onChange();
  }, [onChange]);

  const onChangeDropdown = useCallback(
    (option: DropdownOption) => {
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

  // if the option list changes, clear the selection
  const previousOptions = usePrevious(options);
  useLayoutEffect(() => {
    if (previousOptions !== options) {
      clearValue();
    }
  }, [clearValue, options, previousOptions]);

  return (
    <>
      <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
      {options ? (
        <Dropdown
          key={objectId(options)}
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
          className={`xendit-input xendit-text-14`}
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
