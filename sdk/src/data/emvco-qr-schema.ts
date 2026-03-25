/**
 * Spec for core EMVCo QR:
 * https://mvallim.github.io/emv-qrcode/docs/EMVCo-Merchant-Presented-QR-Specification-v1-1.pdf
 */

export type EmvcoQrTemplateClass = Record<string, EmvcoQrFieldDescriptor>;
export type EmvcoQrFieldDescriptor = {
  name: string;
  type: "template" | "ans" | "string" | "numeric";
  templateClass?: EmvcoQrTemplateClass;
};
export type EmvcoQrData = { [key: string]: string | EmvcoQrData };

// Page 22 Table 3.7 - Additional Data Field Template
export const additionalDataFieldTemplateClass: EmvcoQrTemplateClass = {
  "01": {
    name: "billNumber",
    type: "ans",
  },
  "02": {
    name: "mobileNumber",
    type: "ans",
  },
  "03": {
    name: "storeLabel",
    type: "ans",
  },
  "04": {
    name: "loyaltyNumber",
    type: "ans",
  },
  "05": {
    name: "referenceLabel",
    type: "ans",
  },
  "06": {
    name: "customerLabel",
    type: "ans",
  },
  "07": {
    name: "terminalLabel",
    type: "ans",
  },
  "08": {
    name: "purposeOfTransaction",
    type: "ans",
  },
  "09": {
    name: "additionalConsumerDataRequest",
    type: "ans",
  },
};

// Page 23 Table 3.8 - Language Template
export const languageTemplateClass: EmvcoQrTemplateClass = {
  "00": {
    name: "languagePreference",
    type: "ans",
  },
  "01": {
    name: "merchantNameAlternateLanguage",
    type: "string",
  },
  "02": {
    name: "merchantCityAlternateLanguage",
    type: "string",
  },
};

// Page 20 Table 3.6
export const rootTemplateClass: Record<string, EmvcoQrFieldDescriptor> = {
  "00": {
    name: "payloadFormatIndicator",
    type: "numeric",
  },
  "01": {
    name: "pointOfInitiationMethod",
    type: "numeric",
  },
  "52": {
    name: "merchantCategoryCode",
    type: "numeric",
  },
  "53": {
    name: "transactionCurrency",
    type: "numeric",
  },
  "54": {
    name: "transactionAmount",
    type: "ans",
  },
  "55": {
    name: "tipOrConvenienceIndicator",
    type: "numeric",
  },
  "56": {
    name: "valueOfConvenienceFeeFixed",
    type: "ans",
  },
  "57": {
    name: "valueOfConvenienceFeePercentage",
    type: "ans",
  },
  "58": {
    name: "countryCode",
    type: "ans",
  },
  "59": {
    name: "merchantName",
    type: "ans",
  },
  "60": {
    name: "merchantCity",
    type: "ans",
  },
  "61": {
    name: "postalCode",
    type: "ans",
  },
  "62": {
    name: "additionalData",
    type: "template",
    templateClass: additionalDataFieldTemplateClass,
  },
  "63": {
    name: "crc",
    type: "ans",
  },
  "64": {
    name: "language",
    type: "template",
    templateClass: languageTemplateClass,
  },
};

// PayNow
export const paynowTemplateClass: EmvcoQrTemplateClass = {
  "00": {
    name: "globallyUniqueIdentifier",
    type: "string",
  },
  "01": {
    name: "type",
    type: "numeric",
  },
  "02": {
    name: "identifier",
    type: "ans",
  },
  "03": {
    name: "editable",
    type: "numeric",
  },
};

// QRIS
export const qrisTemplateClass: EmvcoQrTemplateClass = {
  "00": {
    name: "globallyUniqueIdentifier",
    type: "string",
  },
  "02": {
    name: "nmid",
    type: "ans",
  },
  "03": {
    name: "businessType",
    type: "ans",
  },
};

// DANA
export const danaTemplateClass: EmvcoQrTemplateClass = {
  "00": {
    name: "globallyUniqueIdentifier",
    type: "string",
  },
  "01": {
    name: "merchantId",
    type: "ans",
  },
  "02": {
    name: "storeOrTerminalId",
    type: "ans",
  },
  "03": {
    name: "additionalIdentifier",
    type: "ans",
  },
};

// SGQR
export const sgqrTemplateClass: EmvcoQrTemplateClass = {
  "00": {
    name: "globallyUniqueIdentifier",
    type: "string",
  },
  "01": {
    name: "sgqrNumber",
    type: "ans",
  },
  "02": {
    name: "version",
    type: "ans",
  },
  "03": {
    name: "postalCode",
    type: "ans",
  },
  "04": {
    name: "level",
    type: "ans",
  },
  "05": {
    name: "unit",
    type: "ans",
  },
  "06": {
    name: "misc",
    type: "ans",
  },
  "07": {
    name: "revisionDate",
    type: "ans",
  },
};

// QRPH
// https://xendit.atlassian.net/wiki/spaces/D/pages/3090056015/QR+String+Definitions
export const qrphTemplateClass: EmvcoQrTemplateClass = {
  "00": {
    name: "globallyUniqueIdentifier",
    type: "string",
  },
  "01": {
    name: "acquirerId",
    type: "ans",
  },
  "03": {
    name: "merchantId",
    type: "ans",
  },
  "05": {
    name: "notifyFlags",
    type: "numeric",
  },
};

// dynamic template selection for merchant info fields
export const knownTemplateClasses: Record<string, EmvcoQrTemplateClass> = {
  "ID.CO.QRIS.WWW": qrisTemplateClass,
  "ID.DANA.WWW": danaTemplateClass,
  "SG.SGQR": sgqrTemplateClass,
  "SG.PAYNOW": paynowTemplateClass,
  "ph.ppmi.p2m": qrphTemplateClass,
};
