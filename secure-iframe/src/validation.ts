import {
  CardBrand,
  IframeFieldType,
  IframeValidationError,
} from "../../shared/shared";

export type ValidationResult = {
  empty: boolean;
  valid: boolean;
  errorCodes: IframeValidationError[];
  cardBrand?: CardBrand;
};

/**
 * Returns an array of validation errors.
 */
export function validate(
  inputType: IframeFieldType,
  value: string,
): ValidationResult {
  return {
    empty: true,
    valid: true,
    errorCodes: [],
  };
}
