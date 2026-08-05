import { ChannelProperties } from "./public-sdk";

/**
 * Convert form key/value pairs (from html form) to channel properties
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
export function formKvToChannelProperties(
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

      // wrap in array if the subkey ends in []
      if (parts[0].endsWith("[]")) {
        cursor[parts[0].slice(0, -2)] = [nextValue];
      } else {
        cursor[parts[0]] = nextValue;
      }
    }
  }

  return obj;
}

/**
 * Parse a json string[] with error handling.
 */
function formValueToStringArray(
  subkeys: string[],
  value: string,
): (string | number)[] {
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
 * Get a value out of the channel properties object
 */
export function getValueFromChannelProperty(
  channelProperty: string | string[],
  channelProperties: ChannelProperties | null,
) {
  let str = channelProperty;
  if (!channelProperties) {
    return undefined;
  }
  if (Array.isArray(str)) {
    throw new Error(
      "Getting values from channel property arrays is not supported.",
    );
  }

  let cursor: ChannelProperties[string] = channelProperties;
  while (true) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) {
      return undefined;
    }
    const dotIndex = str.indexOf(".");
    if (dotIndex === -1) {
      return cursor ? cursor[str] : undefined;
    } else {
      const key = str.slice(0, dotIndex);
      cursor = cursor ? cursor[key] : undefined;
      str = str.slice(dotIndex + 1);
    }
  }
}

/**
 * Get the card number from channel properties
 */
export function getCardNumberFromChannelProperties(
  channelProperties: ChannelProperties | null,
) {
  const cardNumber = getValueFromChannelProperty(
    "card_details.card_number",
    channelProperties,
  );
  if (typeof cardNumber !== "string") {
    return null;
  }
  return cardNumber;
}
