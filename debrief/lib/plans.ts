export type PlanLimits = {
  debriefs_per_month: number;
  chat_messages_per_month: number;
  share_links: number;
  email_sends_per_month: number;
};

export const PLAN_LIMITS: Record<"free" | "pro", PlanLimits> = {
  free: {
    debriefs_per_month: 30,
    chat_messages_per_month: 100,
    share_links: 25,
    email_sends_per_month: 40,
  },
  pro: {
    debriefs_per_month: Number.POSITIVE_INFINITY,
    chat_messages_per_month: Number.POSITIVE_INFINITY,
    share_links: Number.POSITIVE_INFINITY,
    email_sends_per_month: Number.POSITIVE_INFINITY,
  },
};
