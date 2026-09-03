// Static imports here make libphonenumber-js bundle only these functions, this file must always be imported dynamically.
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
} from "libphonenumber-js";

export const libphonenumberFacade = {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
};

export type LibphonenumberFacade = typeof libphonenumberFacade;
