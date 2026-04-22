/** Client-side copy for 429 responses (retryAfter in seconds). */
export function rateLimitUserMessage(retryAfterSec: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `You've reached the limit for this hour. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
}

export function retryAfterFromJson(raw: unknown): number {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "retryAfter" in raw &&
    typeof (raw as { retryAfter: unknown }).retryAfter === "number"
  ) {
    return Math.max(1, (raw as { retryAfter: number }).retryAfter);
  }
  return 60;
}

export function isRateLimitThrown(
  err: unknown
): err is { __rateLimit: true; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "__rateLimit" in err &&
    (err as { __rateLimit?: unknown }).__rateLimit === true &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  );
}
