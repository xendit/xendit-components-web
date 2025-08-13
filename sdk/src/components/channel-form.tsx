import React, { useRef, useCallback } from "react";
import { ChannelFormField, ChannelProperties } from "../forms-types";
import Field from "./field";

interface Props {
  form: ChannelFormField[];
  onChannelPropertiesChanged: (channelProperties: ChannelProperties) => void;
}

const ChannelForm: React.FC<Props> = ({ form, onChannelPropertiesChanged }) => {
  const formRef = useRef<HTMLFormElement>(null);

  const getChannelProperties = useCallback((): ChannelProperties => {
    if (!formRef.current) return {};

    // The browser FormData collides with node's FormData, both are global, so we
    // need to make up a type for it
    const formData = new FormData(formRef.current) as unknown as {
      entries: () => IterableIterator<[string, string | Blob]>;
    };

    return formKvToChannelProperties(formData.entries());
  }, []);

  const handleFieldChanged = useCallback(() => {
    if (!formRef.current) return;
    onChannelPropertiesChanged(getChannelProperties());
  }, [getChannelProperties, onChannelPropertiesChanged]);

  const filteredFieldGroups = groupFields(form).filter((group) => group.length);

  return (
    <div class="xendit-channel-form">
      <form ref={formRef}>
        {filteredFieldGroups.map((fieldGroup, groupIndex) => (
          <div key={groupIndex} className="xendit-form-field-group">
            {fieldGroup.map((field, fieldIndex) => {
              return (
                <Field
                  key={fieldIndex}
                  field={field}
                  onChange={handleFieldChanged}
                />
              );
            })}
          </div>
        ))}
      </form>
    </div>
  );
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
  iter: IterableIterator<[string, string | Blob]>
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
  } catch (e) {
    return [value];
  }
}

export default ChannelForm;
