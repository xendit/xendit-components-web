import {
  EmvcoQrData,
  EmvcoQrFieldDescriptor,
  knownTemplateClasses,
  rootTemplateClass,
} from "./data/emvco-qr-schema";

function isHighSurrogatePair(char: string) {
  return /^[\uD800-\uDBFF]$/.test(char);
}

// decode an EMVCo QR string into an array of { key, value } pairs where key is 00 - 99
export function emvcoQrTokenize(
  emvcoString: string,
): { key: string; value: string }[] {
  const seen = new Set<string>();
  const result: { key: string; value: string }[] = [];

  while (emvcoString.length) {
    const currentTag = emvcoString.substring(0, 2);
    if (!/^\d{2}$/.test(currentTag)) {
      throw new Error(
        `Invalid EMVCo QR string, expected tag but got ${currentTag}`,
      );
    }
    if (seen.has(currentTag)) {
      throw new Error(`Duplicate tag ${currentTag} in EMVCo QR string`);
    }
    seen.add(currentTag);
    const lengthStr = emvcoString.substring(2, 4);
    const length = parseInt(lengthStr, 10);
    if (!length) {
      throw new Error(
        `Invalid EMVCo QR string, expected length but got ${lengthStr}`,
      );
    }
    let value = "";
    let valueChars = 0;
    while (valueChars < length) {
      // read a character and increment valueChars unless it's a high surrogate pair
      const char = emvcoString.substring(4 + valueChars, 5 + valueChars);
      value += char;
      if (!isHighSurrogatePair(char)) {
        valueChars++;
      }
    }
    result.push({ key: currentTag, value });
    emvcoString = emvcoString.substring(4 + length);
  }

  return result;
}

/**
 * Parse an EMVCo QR into a structured object
 */
export function emvcoQrParse(str: string): EmvcoQrData {
  const { result, raw } = parseTemplateWithClass(rootTemplateClass, str);

  // additionally parse merchant info using dynamic template selection
  result["merchantAccountInformation"] = {};
  for (const rawField of raw) {
    const fieldNumber = Number(rawField.key);
    if (fieldNumber >= 26 && fieldNumber <= 51) {
      writeMerchantAccountInformationField(
        result["merchantAccountInformation"] as EmvcoQrData,
        rawField.key,
        rawField.value,
      );
    }
  }

  return result;
}

// set a field in the result object, recursively parsing if required
function writeFieldForDescriptor(
  result: EmvcoQrData,
  descriptorMap: Record<string, EmvcoQrFieldDescriptor>,
  key: string,
  value: string,
) {
  result[`field${key}`] = value;
  const descriptor = descriptorMap[key];
  if (!descriptor) {
    return;
  }
  const output =
    descriptor.type === "template" && descriptor.templateClass
      ? parseTemplateWithClass(descriptor.templateClass, value).result
      : value;
  result[descriptor.name] = output;
}

// generic template parser
function parseTemplateWithClass(
  templateClass: Record<string, EmvcoQrFieldDescriptor>,
  str: string,
): { result: EmvcoQrData; raw: ReturnType<typeof emvcoQrTokenize> } {
  const raw = emvcoQrTokenize(str);
  const result: EmvcoQrData = {};

  for (const { key, value } of raw) {
    writeFieldForDescriptor(result, templateClass, key, value);
  }

  return { result, raw };
}

// generic merchant account information field parser
function writeMerchantAccountInformationField(
  result: EmvcoQrData,
  key: string,
  value: string,
) {
  const raw = emvcoQrTokenize(value);
  const fieldType = raw.find(({ key }) => key === "00")?.value;
  if (!fieldType) {
    throw new Error(
      `Missing field 00 in merchant account information template for field ${key}`,
    );
  }
  const templateClass = knownTemplateClasses[fieldType];
  if (templateClass) {
    result[fieldType] = parseTemplateWithClass(templateClass, value).result;
  }

  return result;
}
