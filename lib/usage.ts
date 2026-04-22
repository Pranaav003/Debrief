import { PLAN_LIMITS } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase";

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function getUserPlan(ownerToken: string): Promise<"free" | "pro"> {
  const { data } = await supabaseAdmin()
    .from("subscriptions")
    .select("plan, status")
    .eq("owner_token", ownerToken)
    .maybeSingle();

  if (!data) return "free";
  if (data.status === "past_due") return "free";
  if (data.plan === "pro" && (data.status === "active" || data.status === "trialing")) {
    return "pro";
  }
  return "free";
}

export type UsageSnapshot = {
  debriefs: number;
  chatMessages: number;
  shareLinks: number;
  emailSends: number;
};

export async function getUsage(ownerToken: string): Promise<UsageSnapshot> {
  const month = getCurrentMonth();

  const { data } = await supabaseAdmin()
    .from("usage_counts")
    .select("*")
    .eq("owner_token", ownerToken)
    .eq("month", month)
    .maybeSingle();

  return {
    debriefs: data?.debriefs_count ?? 0,
    chatMessages: data?.chat_messages_count ?? 0,
    shareLinks: data?.share_links_count ?? 0,
    emailSends: data?.email_sends_count ?? 0,
  };
}

export async function incrementUsage(
  ownerToken: string,
  field: "debriefs_count" | "chat_messages_count" | "share_links_count" | "email_sends_count"
): Promise<void> {
  const month = getCurrentMonth();
  const { error } = await supabaseAdmin().rpc("increment_usage", {
    p_owner_token: ownerToken,
    p_month: month,
    p_field: field,
  });
  if (error) {
    console.error("[usage] increment_usage RPC failed:", error.message);
  }
}

export async function checkLimit(
  ownerToken: string,
  type: "debriefs" | "chatMessages" | "shareLinks" | "emailSends"
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const [plan, usage] = await Promise.all([getUserPlan(ownerToken), getUsage(ownerToken)]);

  const limits = PLAN_LIMITS[plan];

  const map: Record<
    typeof type,
    { usageKey: keyof UsageSnapshot; limitKey: keyof typeof limits }
  > = {
    debriefs: { usageKey: "debriefs", limitKey: "debriefs_per_month" },
    chatMessages: { usageKey: "chatMessages", limitKey: "chat_messages_per_month" },
    shareLinks: { usageKey: "shareLinks", limitKey: "share_links" },
    emailSends: { usageKey: "emailSends", limitKey: "email_sends_per_month" },
  };

  const { usageKey, limitKey } = map[type];
  const current = usage[usageKey];
  const limit = limits[limitKey];

  return {
    allowed: current < limit,
    current,
    limit: Number.isFinite(limit) ? limit : current + 1,
  };
}
