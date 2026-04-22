import { notFound } from "next/navigation";
import { ShareView } from "@/components/ShareView";
import { loadShareBySlug } from "@/lib/loadShareBySlug";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await loadShareBySlug(params.slug);
  const baseSite = getSiteUrl();

  if (!data) {
    return {
      title: "Debrief",
      openGraph: { url: `${baseSite}/share/${params.slug}` },
    };
  }

  const meetingTitle =
    data.debrief.meetingTitle?.trim() || data.debrief.result?.meetingTitle?.trim() || null;

  const title = meetingTitle ? `${meetingTitle} — Debrief` : "Debrief";
  const description = `Meeting debrief: ${meetingTitle ?? "Shared meeting"}. Powered by Debrief.`;

  return {
    title,
    description,
    openGraph: {
      title,
      url: `${baseSite}/share/${params.slug}`,
      description: "Meeting notes, decisions, and action items — organized automatically.",
    },
  };
}

export default async function SharePage({ params }: { params: { slug: string } }) {
  const data = await loadShareBySlug(params.slug);
  if (!data) notFound();

  return (
    <ShareView debrief={data.debrief} role={data.role} shareSlug={data.shareSlug} />
  );
}
