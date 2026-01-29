export interface BffInstallmentPlan {
  interval: string;
  interval_count: number;
  terms: number;
  installment_amount: number;
  total_amount: number;
  code: string;
  interest_rate: number;
  description: string;
}

export interface BffPaylaterPlan {
  interval?: string;
  interval_count?: number;
  terms?: number;
  installment_amount?: number;
  total_amount?: number;
  interest_rate?: number;
  description?: string;
  downpayment_amount?: number;
}

export interface BffPaymentOptions {
  channel_code: string;
  country: string;
  currency: string;
  amount: number;
  installment_plans?: BffInstallmentPlan[];
  paylater_plans?: BffPaylaterPlan[];
}
