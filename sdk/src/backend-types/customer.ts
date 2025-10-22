export type BffCustomerType = "INDIVIDUAL" | "BUSINESS";

export type BffCustomer = {
  id: string;
  type: BffCustomerType;
  email: string | null;
  mobile_number: string | null;
  phone_number: string | null;
  business_detail: unknown;
  individual_detail: {
    given_names: string | null;
    surname: string | null;
  } | null;
};
