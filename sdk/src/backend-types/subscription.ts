export type BffSubscriptionSchedule = {
  anchor_date: string;
  interval: "DAY" | "WEEK" | "MONTH";
  interval_count: number;
  retry_interval?: "DAY" | "WEEK" | "MONTH";
  retry_interval_count?: number;
  total_recurrence?: number;
  total_retry?: number;
};

export type BffSubscription = {
  immediate_payment?: boolean;
  schedule: BffSubscriptionSchedule;
};
