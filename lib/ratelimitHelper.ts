import { NextRequest, NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";

export async function checkRateLimit(
  req: NextRequest,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  if (!limiter) return null;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  let success: boolean;
  let limit: number;
  let reset: number;
  let remaining: number;

  try {
    const out = await limiter.limit(ip);
    success = out.success;
    limit = out.limit;
    reset = out.reset;
    remaining = out.remaining;
  } catch (e) {
    // Upstash inactive/archived DB, bad credentials, or network — don't brick API routes.
    console.error("[ratelimit] Redis unavailable, allowing request:", e);
    return null;
  }

  if (!success) {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: "Too many requests. Please wait before trying again.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": retryAfterSec.toString(),
        },
      }
    );
  }

  return null;
}
