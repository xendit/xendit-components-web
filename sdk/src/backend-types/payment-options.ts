export type BffPaymentOptions = {
  channel_code: string;
  country: string;
  amount: number;
  currency: string;
  installment_plans: BffCardsInstallmentPlan[];
};

export type BffCardsInstallmentPlan = {
  interval: string;
  interval_count: number;
  terms: number;
  installment_amount: number;
  total_amount: number;
  interest_rate?: number;
  description?: string;
  code?: string;
};
