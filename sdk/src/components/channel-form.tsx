import { ChannelFormField, ChannelProperties } from "../backend-types/channel";
import { BffSession, BffSessionType } from "../backend-types/session";
import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { useSession } from "./session-provider";
import FieldGroup from "./field-group";
import { BffCardDetails } from "../backend-types/card-details";
import { usePrevious } from "../utils";
import { createContext } from "preact";
import { forwardRef } from "react";
import { InternalSetFieldTouchedEvent } from "../private-event-types";
import { useChannelComponentData } from "./payment-channel";
import { getChannelPropertyValue } from "../validation";

interface Props {
  form: ChannelFormField[];
  onChannelPropertiesChanged: (channelProperties: ChannelProperties) => void;
}
export interface ChannelFormHandle {
  setAllFieldsTouched: () => void;
}

const ChannelForm = forwardRef<ChannelFormHandle, Props>(
  ({ form, onChannelPropertiesChanged }, ref) => {
    const session = useSession();
    const cardDetails = useChannelComponentData()?.cardDetails;
    const formRef = useRef<HTMLFormElement>(null);

    const [channelProperties, setChannelProperties] =
      useState<ChannelProperties | null>(null);

    useImperativeHandle(ref, () => ({
      setAllFieldsTouched() {
        const form = formRef.current;
        if (!form) return;
        Array.from(form.elements)
          .filter((el) => el instanceof HTMLInputElement)
          .forEach((input) => {
            if (!input.name) {
              // only mark named fields as touched
              return;
            }
            input.dispatchEvent(new InternalSetFieldTouchedEvent());
          });
      },
    }));

    const getChannelProperties = useCallback((): ChannelProperties => {
      if (!formRef.current) return {};

      // The browser FormData collides with node's FormData, both are global, so we
      // need to make up a type for
      const formData = new FormData(formRef.current) as unknown as {
        entries: () => IterableIterator<[string, string | Blob]>;
      };

      return formKvToChannelProperties(formData.entries());
    }, []);

    const handleFieldChanged = useCallback(() => {
      if (!formRef.current) return;
      const channelProperties = getChannelProperties();
      setChannelProperties(channelProperties);
      onChannelPropertiesChanged(channelProperties);
    }, [getChannelProperties, onChannelPropertiesChanged]);

    const filteredForm = useFilteredFormFields(
      session,
      form,
      cardDetails?.details ?? null,
      channelProperties || {},
    );

    // trigger a field changed callback when the form changes
    const previousFilteredForm = usePrevious(filteredForm);
    useEffect(() => {
      if (
        // only trigger if the form structure changed
        JSON.stringify(previousFilteredForm) !== JSON.stringify(filteredForm)
      ) {
        handleFieldChanged();
      }
    }, [filteredForm, handleFieldChanged, previousFilteredForm]);

    const filteredFieldGroups = groupFields(filteredForm).filter(
      (group) => group.length,
    );

    if (filteredFieldGroups.length === 0) {
      return null;
    }

    return (
      <div class="xendit-channel-form">
        <form ref={formRef}>
          <ChannelPropertiesContext.Provider value={channelProperties}>
            {filteredFieldGroups.map((fieldGroup, index) => (
              <FieldGroup
                key={index}
                fieldGroup={fieldGroup}
                groupIndex={index}
                handleFieldChanged={handleFieldChanged}
                channelProperties={channelProperties}
              />
            ))}
          </ChannelPropertiesContext.Provider>
        </form>
      </div>
    );
  },
);

export const ChannelPropertiesContext = createContext<ChannelProperties | null>(
  null,
);

export const useChannelProperties = (): ChannelProperties | null => {
  return useContext(ChannelPropertiesContext);
};

function groupFields(fields: ChannelFormField[]): ChannelFormField[][] {
  // Group fields for rendering
  const fieldGroups: ChannelFormField[][] = [[]];
  for (const field of fields) {
    if (
      field.span === 1 &&
      fieldGroups[fieldGroups.length - 1].length === 1 &&
      fieldGroups[fieldGroups.length - 1][0].span === 1
    ) {
      // join two half-width fields into one group
      fieldGroups[fieldGroups.length - 1].push(field);
      continue;
    }

    if (field.join) {
      // if the field should be explicitly joined, add it to the last group
      fieldGroups[fieldGroups.length - 1].push(field);
      continue;
    }

    // otherwise, start a new group
    fieldGroups.push([field]);
  }

  return fieldGroups;
}

/**
 * Convert form key/value pairs to channel properties
 * .e.g
 * Input:
 * {
 *   "k": "v1",
 *   "a.b.c": "v2",
 *   "z.z__a.y": ["v3", "v3"],
 * }
 * Output:
 * {
 *   k: "v1",
 *   a: { b: { c: "v2", }, },
 *   z: { z: "v3", y: "v4" },
 * }
 **/
function formKvToChannelProperties(
  iter: IterableIterator<[string, string | Blob]>,
): ChannelProperties {
  const obj: ChannelProperties = {};

  for (const [key, rawValue] of iter) {
    if (rawValue instanceof Blob) {
      continue;
    }

    // keys with __ represent multiple k/v pairs
    // e.g. `{"a__b": ["1", "2"]}` becomes `{a: "1", b: "2"}`
    const subkeys = key.split("__");

    // if there are multiple subkeys, assume the value is a JSON array of strings
    const valueAsArray = formValueToStringArray(subkeys, rawValue);

    outer: for (const subkey of subkeys) {
      // split key by dot, for each part, traverse the object
      // and assign the value at the end
      // e.g. { "branch.leaf": "value" } becomes { branch: { leaf: "value" } }
      // cursor will be the leaf object
      const parts = subkey.split(".");
      let cursor = obj;
      while (parts.length > 1) {
        const part = parts.shift()!;
        let selected = cursor[part];
        if (selected === undefined) {
          // child object doesn't exist, create it
          selected = cursor[part] = {};
        }
        if (selected && typeof selected === "object") {
          if (Array.isArray(selected)) {
            continue outer; // should never happen
          }
          // traverse into child object
          cursor = selected;
        }
      }

      // assign next value to channel properties
      const nextValue = valueAsArray.length ? valueAsArray.shift() : "";
      cursor[parts[0]] = nextValue;
    }
  }

  return obj;
}

/**
 * Parse a json string[] with error handling.
 */
function formValueToStringArray(subkeys: string[], value: string): string[] {
  if (subkeys.length === 0) return [];
  if (subkeys.length === 1) return [value];
  if (value === "") return [];
  try {
    return JSON.parse(value);
  } catch (_e) {
    return [value];
  }
}

/**
 * Takes a form and filters out fields that should not be shown based on context.
 */
export function useFilteredFormFields(
  session: BffSession,
  form: ChannelFormField[],
  cardInfo: BffCardDetails | null,
  channelProperties: ChannelProperties,
) {
  const filteredForm = useMemo(() => {
    return filterFormFields(
      session.session_type,
      form,
      cardInfo?.require_billing_information ?? false,
      channelProperties,
    );
  }, [
    cardInfo?.require_billing_information,
    form,
    session.session_type,
    channelProperties,
  ]);

  return filteredForm;
}

export function filterFormFields(
  sessionType: BffSessionType,
  form: ChannelFormField[],
  showBillingDetailsFields: boolean,
  channelProperties: ChannelProperties,
) {
  return form.filter((field) => {
    if (field.flags?.require_billing_information) {
      // these fields should only be shown if billing details are required
      if (sessionType !== "PAY") return false;
      if (!showBillingDetailsFields) return false;
    }
    // if any condition is not met, hide the field
    for (const condition of field.display_if || []) {
      const [property, operator, value] = condition;
      const channelValue = getChannelPropertyValue(channelProperties, property);
      switch (operator) {
        case "equals":
          if (channelValue !== value) return false;
          break;
        case "not_equals":
          if (channelValue === value) return false;
          break;
      }
    }
    return true;
  });
}

export default ChannelForm;
