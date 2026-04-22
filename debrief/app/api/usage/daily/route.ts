import { NextRequest, NextResponse } from "next/server";
import { getDailyCount } from "@/lib/dailyUsage";
import { DAILY_DEBRIEF_LIMIT } from "@/lib/limits";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";

export async function GET(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, generalRatelimit);
  if (rateLimitRes) return rateLimitRes;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");
  if (!ownerToken) {
    return NextResponse.json({ count: 0, limit: DAILY_DEBRIEF_LIMIT, remaining: DAILY_DEBRIEF_LIMIT });
  }

  const count = await getDailyCount(ownerToken);
  return NextResponse.json({
    count,
    limit: DAILY_DEBRIEF_LIMIT,
    remaining: Math.max(0, DAILY_DEBRIEF_LIMIT - count),
  });
}
