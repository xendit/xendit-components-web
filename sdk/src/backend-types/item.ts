export type BffItemType =
  | "DIGITAL_PRODUCT"
  | "PHYSICAL_PRODUCT"
  | "DIGITAL_SERVICE"
  | "PHYSICAL_SERVICE"
  | "FEE";

export type BffItem = {
  type: BffItemType;
  name: string;
  net_unit_amount: number;
  quantity: number;
  reference_id?: string;
  url?: string;
  image_url?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  metadata?: Record<string, string>;
};
