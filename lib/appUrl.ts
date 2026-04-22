import { getSiteUrl } from "./site";

/**
 * Absolute origin for server-side fetch to this app (e.g. share page calling its own API).
 * In production, defaults to the same canonical URL as {@link getSiteUrl} (debrief.pranaaviyer.com).
 * For local dev, set NEXT_PUBLIC_APP_URL=http://localhost:3000 or rely on the development fallback below.
 */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.startsWith("http") ? explicit.replace(/\/$/, "") : `https://${explicit}`.replace(/\/$/, "");
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    return site.startsWith("http") ? site.replace(/\/$/, "") : `https://${site}`.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return getSiteUrl();
}
