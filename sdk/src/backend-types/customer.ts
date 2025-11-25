export type BffCustomerType = "INDIVIDUAL" | "BUSINESS";

// TODO: check this is correct, add businessDetail
export type BffCustomer = {
  id: string;
  reference_id: string;
  type: BffCustomerType;
  email: string | null;
  mobile_number: string | null;
  phone_number: string | null;
  business_detail: unknown;
  individual_detail: {
    given_names: string;
    surname: string | null;
  } | null;
};
