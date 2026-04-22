import { mapSupabaseRowToDebrief, type DebriefRow } from "@/lib/supabaseDebrief";
import { supabaseAdmin } from "@/lib/supabase";
import type { Debrief, ShareRole } from "@/lib/types";

export type SharePagePayload = {
  debrief: Debrief;
  role: ShareRole;
  shareSlug: string;
};

/**
 * Server-only: resolve an active share link and its debrief. Used by the share page and API
 * — do not call this from the client. Avoids HTTP self-fetch from RSC (can deadlock dev server).
 */
export async function loadShareBySlug(slug: string): Promise<SharePagePayload | null> {
  const { data: share, error: shareErr } = await supabaseAdmin()
    .from("debrief_shares")
    .select("debrief_id, role, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (shareErr || !share || !share.is_active) {
    return null;
  }

  const { data: row, error: debriefErr } = await supabaseAdmin()
    .from("debriefs")
    .select("id, meeting_title, meeting_type, result, notes, created_at, transcript, chat_history")
    .eq("id", share.debrief_id)
    .maybeSingle();

  if (debriefErr || !row) {
    return null;
  }

  const debrief = mapSupabaseRowToDebrief(row as DebriefRow);
  if (!debrief) {
    return null;
  }

  return {
    debrief,
    role: share.role as ShareRole,
    shareSlug: slug,
  };
}
