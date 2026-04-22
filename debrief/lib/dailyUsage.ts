import { DAILY_DEBRIEF_LIMIT } from "@/lib/limits";
import { supabaseAdmin } from "@/lib/supabase";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getDailyCount(ownerToken: string): Promise<number> {
  try {
    const { data } = await supabaseAdmin()
      .from("daily_usage")
      .select("debrief_count")
      .eq("owner_token", ownerToken)
      .eq("date", getToday())
      .maybeSingle();

    return data?.debrief_count ?? 0;
  } catch (error) {
    console.error("[dailyUsage] getDailyCount failed:", error);
    return 0;
  }
}

export async function checkDailyLimit(ownerToken: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  resetsAt: string;
}> {
  const current = await getDailyCount(ownerToken);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    allowed: current < DAILY_DEBRIEF_LIMIT,
    current,
    limit: DAILY_DEBRIEF_LIMIT,
    resetsAt: tomorrow.toISOString(),
  };
}

export async function incrementDailyCount(ownerToken: string): Promise<number> {
  try {
    const { data } = await supabaseAdmin().rpc("increment_daily_usage", {
      p_owner_token: ownerToken,
      p_date: getToday(),
    });

    return typeof data === "number" ? data : 0;
  } catch (error) {
    console.error("[dailyUsage] incrementDailyCount failed:", error);
    return 0;
  }
}
