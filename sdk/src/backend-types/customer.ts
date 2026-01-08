export type BffCustomerType = "INDIVIDUAL" | "BUSINESS";

// TODO: backend doens't return all fields, expose all fields when available
export type BffCustomer = {
  id: string;
  type: BffCustomerType;
  email: string | null;
  mobile_number: string | null;
  phone_number: string | null;
  business_detail: null;
  individual_detail: {
    given_names: string;
    surname: string | null;
  } | null;
};
