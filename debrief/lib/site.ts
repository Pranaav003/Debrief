/**
 * Production canonical origin (no trailing slash). Override with NEXT_PUBLIC_SITE_URL for staging.
 */
export const PUBLIC_SITE_ORIGIN = "https://debrief.pranaaviyer.com";

/**
 * Canonical public site URL (no trailing slash).
 * Set NEXT_PUBLIC_SITE_URL in env for staging or local overrides; otherwise defaults to {@link PUBLIC_SITE_ORIGIN}.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const u = explicit.startsWith("http") ? explicit : `https://${explicit}`;
    return u.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const u = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return u.replace(/\/$/, "");
  }
  return PUBLIC_SITE_ORIGIN;
}
