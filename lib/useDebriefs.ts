"use client";

import { useCallback, useEffect, useState } from "react";
import type { Debrief, DebriefResult, DebriefShare, MeetingType, ShareRole } from "@/lib/types";
import { parseDeBriefResult } from "@/lib/types";
import { getOwnerToken } from "@/lib/ownerToken";
import {
  isChatMessageEntry,
  isMeetingType,
  mapSupabaseRowToDebrief,
  type DebriefRow,
} from "@/lib/supabaseDebrief";

const CACHE_KEY = "debrief-cache-v2";

type DebriefListRow = {
  id: string;
  created_at?: string;
  meeting_title?: string | null;
  meeting_type?: string | null;
  is_public?: boolean;
  share_slug?: string | null;
};

function mapListRowToPartial(row: DebriefListRow): Debrief {
  const mt: MeetingType = isMeetingType(row.meeting_type)
    ? row.meeting_type
    : "general_sync";
  const title =
    typeof row.meeting_title === "string" && row.meeting_title.trim()
      ? row.meeting_title
      : "Untitled meeting";

  // Partial debrief (no transcript/result yet). We still must satisfy Debrief type,
  // so we create a minimal placeholder result; selectDebrief will fetch full.
  const placeholder: DebriefResult = {
    meetingTitle: title,
    date: "",
    meetingType: mt,
    attendees: [],
    summary: "",
    actionItems: [],
    followUpEmail: { subject: "", body: "" },
    decisions: [],
    openQuestions: [],
  } as unknown as DebriefResult;

  return {
    id: row.id,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    meetingTitle: title,
    date: "",
    meetingType: mt,
    transcript: "",
    result: placeholder,
    notes: "",
    chatHistory: [],
    isPublic: row.is_public === true,
    shareSlug: row.share_slug ?? null,
  };
}

function loadCache(): { debriefs: Debrief[]; activeId: string | null } {
  if (typeof window === "undefined") return { debriefs: [], activeId: null };
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { debriefs: [], activeId: null };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { debriefs: [], activeId: null };
    const o = parsed as { debriefs?: unknown; activeId?: unknown };
    const list = Array.isArray(o.debriefs) ? (o.debriefs as unknown[]) : [];
    const debriefs: Debrief[] = [];
    for (const item of list) {
      if (typeof item !== "object" || item === null) continue;
      const d = item as Partial<Debrief>;
      if (typeof d.id !== "string") continue;
      if (!d.result) continue;
      const parsedResult = parseDeBriefResult(d.result as unknown);
      if (!parsedResult) continue;
      debriefs.push({
        id: d.id,
        createdAt: typeof d.createdAt === "string" ? d.createdAt : undefined,
        meetingTitle: typeof d.meetingTitle === "string" ? d.meetingTitle : parsedResult.meetingTitle,
        date: typeof d.date === "string" ? d.date : parsedResult.date,
        meetingType: isMeetingType(d.meetingType) ? d.meetingType : parsedResult.meetingType,
        transcript: typeof d.transcript === "string" ? d.transcript : "",
        result: parsedResult,
        notes: typeof d.notes === "string" ? d.notes : "",
        chatHistory: Array.isArray(d.chatHistory)
          ? (d.chatHistory as unknown[]).filter(isChatMessageEntry)
          : [],
        isPublic: d.isPublic === true,
        shareSlug: d.shareSlug ?? null,
      });
    }
    return {
      debriefs,
      activeId: typeof o.activeId === "string" ? o.activeId : null,
    };
  } catch {
    return { debriefs: [], activeId: null };
  }
}

function saveCache(debriefs: Debrief[], activeId: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ debriefs, activeId }));
  } catch {
    /* ignore */
  }
}

const HOOK_SAVE_ERROR =
  "Failed to save changes. Your work may not be saved.";

const SAVE_NETWORK_ERROR =
  "Connection lost. Could not save debrief. Check your internet and try again.";

const SUPABASE_UNREACHABLE_HINT =
  "Could not reach Supabase from this machine. Open the Supabase dashboard and confirm the project is running (not paused). Then verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local match that project.";

/**
 * Supabase's server-side client sometimes surfaces undici errors as the literal string
 * "TypeError: fetch failed" in JSON — that is not your Wi‑Fi; it is the API route failing to connect to Supabase.
 */
function humanizeDebriefApiError(raw: string): string {
  const s = raw.trim();
  if (/typeerror:\s*fetch failed/i.test(s)) {
    return SUPABASE_UNREACHABLE_HINT;
  }
  if (/^fetch failed$/i.test(s) || /^failed to fetch$/i.test(s)) {
    return SUPABASE_UNREACHABLE_HINT;
  }
  return s;
}

/**
 * True only when the browser never got a normal HTTP response (offline, DNS, reset).
 * Do not use broad "fetch" substring matching — Supabase/API error strings often contain
 * "fetch" and must not be shown as "check your internet."
 */
function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const m = err.message;
    return /failed to fetch|fetch failed|networkerror|load failed|econnrefused|enotfound|econnreset/i.test(
      m
    );
  }
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    return err.name === "NetworkError" || err.name === "AbortError";
  }
  return false;
}

export function useDebriefs() {
  const [debriefs, setDebriefs] = useState<Debrief[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDebrief, setActiveDebrief] = useState<Debrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [hookError, setHookError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [activeShares, setActiveShares] = useState<DebriefShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const ownerToken = typeof window !== "undefined" ? getOwnerToken() : "";

  const dismissHookError = useCallback(() => setHookError(null), []);

  // Load cache immediately
  useEffect(() => {
    const cached = loadCache();
    setDebriefs(cached.debriefs);
    setActiveId(cached.activeId);
    const existing = cached.activeId
      ? cached.debriefs.find((d) => d.id === cached.activeId) ?? null
      : null;
    setActiveDebrief(existing);
  }, []);

  // Persist cache
  useEffect(() => {
    saveCache(debriefs, activeId);
  }, [debriefs, activeId]);

  const refetch = useCallback(async () => {
    if (!ownerToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setHookError(null);
    try {
      const res = await fetch(`/api/debriefs?ownerToken=${ownerToken}`);
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const raw =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Could not load your debriefs. Check your connection and try again.";
        setHookError(humanizeDebriefApiError(raw));
        return;
      }
      const rows = Array.isArray(data) ? (data as DebriefListRow[]) : [];
      const list = rows.map(mapListRowToPartial);
      setDebriefs((prev) => {
        const byId = new Map(prev.map((d) => [d.id, d]));
        return list.map((d) => byId.get(d.id) ?? d);
      });
    } catch (err) {
      console.error(err);
      setHookError(
        isNetworkError(err)
          ? "Connection lost. Check your internet and try again."
          : "Could not load your debriefs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [ownerToken]);

  useEffect(() => {
    if (!ownerToken) {
      setLoading(false);
      return;
    }
    void refetch();
  }, [ownerToken, refetch]);

  const addDebrief = useCallback(
    async (payload: {
      meetingTitle: string;
      meetingType: MeetingType;
      transcript: string;
      result: DebriefResult;
    }): Promise<Debrief> => {
      try {
        const res = await fetch("/api/debriefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerToken,
            meetingTitle: payload.meetingTitle,
            meetingType: payload.meetingType,
            transcript: payload.transcript,
            result: payload.result,
            notes: "",
            chatHistory: [],
          }),
        });
        const data = (await res.json()) as unknown;
        if (!res.ok) {
          const raw =
            typeof data === "object" && data !== null && "error" in data
              ? String((data as { error: unknown }).error)
              : `Request failed (${res.status})`;
          const msg = humanizeDebriefApiError(raw);
          setHookError(HOOK_SAVE_ERROR);
          throw new Error(msg);
        }
        const full = mapSupabaseRowToDebrief(data as DebriefRow);
        if (!full) {
          setHookError(HOOK_SAVE_ERROR);
          throw new Error("Could not parse debrief from server.");
        }
        setHookError(null);
        setDebriefs((prev) => [full, ...prev.filter((d) => d.id !== full.id)]);
        setActiveId(full.id);
        setActiveDebrief(full);
        return full;
      } catch (err) {
        console.error(err);
        if (isNetworkError(err)) {
          setHookError(SAVE_NETWORK_ERROR);
          throw new Error(SAVE_NETWORK_ERROR);
        }
        throw err;
      }
    },
    [ownerToken]
  );

  const updateDebrief = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/debriefs/${id}?ownerToken=${ownerToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const data = (await res.json()) as unknown;
        if (!res.ok) {
          const raw =
            typeof data === "object" && data !== null && "error" in data
              ? String((data as { error: unknown }).error)
              : `Request failed (${res.status})`;
          const msg = humanizeDebriefApiError(raw);
          setHookError(HOOK_SAVE_ERROR);
          throw new Error(msg);
        }
        const full = mapSupabaseRowToDebrief(data as DebriefRow);
        if (!full) {
          setHookError(HOOK_SAVE_ERROR);
          throw new Error("Could not parse updated debrief from server.");
        }
        setHookError(null);
        setDebriefs((prev) => prev.map((d) => (d.id === id ? { ...d, ...full } : d)));
        setActiveDebrief((prev) => (prev?.id === id ? { ...prev, ...full } : prev));
        return full;
      } catch (err) {
        console.error(err);
        if (isNetworkError(err)) {
          setHookError(
            "Connection lost. Your latest changes may not be saved. Try again."
          );
        } else if (!(err instanceof Error)) {
          setHookError(HOOK_SAVE_ERROR);
        }
        throw err;
      }
    },
    [ownerToken]
  );

  const deleteDebrief = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/debriefs/${id}?ownerToken=${ownerToken}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setHookError(
            humanizeDebriefApiError(data.error ?? "Could not delete debrief. Try again.")
          );
          return;
        }
        setHookError(null);
        setDebriefs((prev) => prev.filter((d) => d.id !== id));
        setActiveId((cur) => (cur === id ? null : cur));
        setActiveDebrief((cur) => (cur?.id === id ? null : cur));
      } catch (err) {
        console.error(err);
        setHookError(
          isNetworkError(err)
            ? "Connection lost. Debrief may still exist on the server."
            : "Could not delete debrief. Try again."
        );
      }
    },
    [ownerToken]
  );

  const selectDebrief = useCallback(
    async (id: string) => {
      setDetailLoadError(null);
      setActiveId(id);
      const existing = debriefs.find((d) => d.id === id);
      if (existing) {
        setActiveDebrief(existing);
      }

      const hasFullFromServer =
        existing &&
        String(existing.transcript ?? "").trim().length > 0 &&
        existing.result;

      if (hasFullFromServer) {
        setDetailLoading(false);
        return;
      }

      setDetailLoading(true);
      try {
        const res = await fetch(`/api/debriefs/${id}?ownerToken=${ownerToken}`);
        const data = (await res.json()) as unknown;
        if (!res.ok) {
          const raw =
            typeof data === "object" && data !== null && "error" in data
              ? String((data as { error: unknown }).error)
              : "Could not load debrief.";
          setDetailLoadError(humanizeDebriefApiError(raw));
          if (existing) {
            setActiveDebrief(existing);
          } else {
            setActiveDebrief(null);
            setActiveId(null);
          }
          return;
        }
        const full = mapSupabaseRowToDebrief(data as DebriefRow);
        if (!full) {
          setDetailLoadError("Could not read debrief data.");
          if (existing) setActiveDebrief(existing);
          return;
        }
        setDetailLoadError(null);
        setDebriefs((prev) => prev.map((d) => (d.id === id ? full : d)));
        setActiveDebrief(full);
      } catch (err) {
        console.error(err);
        setDetailLoadError(
          isNetworkError(err)
            ? "Connection lost. Check your internet and try again."
            : "Something went wrong loading this debrief."
        );
        if (existing) setActiveDebrief(existing);
      } finally {
        setDetailLoading(false);
      }
    },
    [debriefs, ownerToken]
  );

  const newDebrief = useCallback(() => {
    setActiveId(null);
    setActiveDebrief(null);
  }, []);

  const updateResult = useCallback(
    async (id: string, result: DebriefResult) => {
      setActiveDebrief((prev) => (prev?.id === id ? { ...prev, result } : prev));
      await updateDebrief(id, { result });
    },
    [updateDebrief]
  );

  const updateNotes = useCallback(
    async (id: string, notes: string) => {
      setActiveDebrief((prev) => (prev?.id === id ? { ...prev, notes } : prev));
      await updateDebrief(id, { notes });
    },
    [updateDebrief]
  );

  const updateChatHistory = useCallback(
    async (id: string, chatHistory: Debrief["chatHistory"]) => {
      setActiveDebrief((prev) => (prev?.id === id ? { ...prev, chatHistory } : prev));
      await updateDebrief(id, { chatHistory });
    },
    [updateDebrief]
  );

  const updateMeetingType = useCallback(
    async (id: string, type: MeetingType) => {
      await updateDebrief(id, { meetingType: type, result: { ...(activeDebrief?.result ?? {}), meetingType: type } });
    },
    [activeDebrief?.result, updateDebrief]
  );

  const updateResultField = useCallback(
    async (id: string, field: string, value: unknown) => {
      const current = activeDebrief?.id === id ? activeDebrief : debriefs.find((d) => d.id === id);
      if (!current) return;
      const nextResult = ({ ...(current.result as object), [field]: value } as unknown) as DebriefResult;
      setDebriefs((prev) => prev.map((d) => (d.id === id ? { ...d, result: nextResult } : d)));
      if (activeDebrief?.id === id) setActiveDebrief({ ...current, result: nextResult });
      await updateDebrief(id, { result: nextResult });
    },
    [activeDebrief, debriefs, updateDebrief]
  );

  const updateArrayField = useCallback(
    async (id: string, field: string, index: number, value: string) => {
      const current = activeDebrief?.id === id ? activeDebrief : debriefs.find((d) => d.id === id);
      if (!current) return;
      const existing = (current.result as Record<string, unknown>)[field];
      const arr = Array.isArray(existing) ? [...existing] : [];
      arr[index] = value;
      await updateResultField(id, field, arr);
    },
    [activeDebrief, debriefs, updateResultField]
  );

  const addArrayItem = useCallback(
    async (id: string, field: string, item: unknown) => {
      const current = activeDebrief?.id === id ? activeDebrief : debriefs.find((d) => d.id === id);
      if (!current) return;
      const existing = (current.result as Record<string, unknown>)[field];
      const arr = Array.isArray(existing) ? [...existing] : [];
      arr.push(item);
      await updateResultField(id, field, arr);
    },
    [activeDebrief, debriefs, updateResultField]
  );

  const removeArrayItem = useCallback(
    async (id: string, field: string, index: number) => {
      const current = activeDebrief?.id === id ? activeDebrief : debriefs.find((d) => d.id === id);
      if (!current) return;
      const existing = (current.result as Record<string, unknown>)[field];
      const arr = Array.isArray(existing) ? [...existing] : [];
      arr.splice(index, 1);
      await updateResultField(id, field, arr);
    },
    [activeDebrief, debriefs, updateResultField]
  );

  const togglePublic = useCallback(
    async (id: string, isPublic: boolean) => {
      return updateDebrief(id, { isPublic });
    },
    [updateDebrief]
  );

  const loadShares = useCallback(
    async (debriefId: string) => {
      if (!ownerToken) {
        setActiveShares([]);
        return;
      }
      setSharesLoading(true);
      try {
        const res = await fetch(
          `/api/debriefs/${debriefId}/shares?ownerToken=${encodeURIComponent(ownerToken)}`
        );
        const data = (await res.json()) as unknown;
        if (!res.ok) {
          setActiveShares([]);
          return;
        }
        setActiveShares(Array.isArray(data) ? (data as DebriefShare[]) : []);
      } catch (err) {
        console.error(err);
        setActiveShares([]);
      } finally {
        setSharesLoading(false);
      }
    },
    [ownerToken]
  );

  const createShare = useCallback(
    async (debriefId: string, role: ShareRole, label?: string) => {
      if (!ownerToken) throw new Error("Missing owner token");
      const res = await fetch(
        `/api/debriefs/${debriefId}/shares?ownerToken=${encodeURIComponent(ownerToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, label }),
        }
      );
      const json = (await res.json()) as unknown;
      if (!res.ok) {
        const raw =
          typeof json === "object" &&
          json !== null &&
          "error" in json &&
          typeof (json as { error: unknown }).error === "string"
            ? (json as { error: string }).error
            : "Could not create share";
        throw new Error(humanizeDebriefApiError(raw));
      }
      const share = json as DebriefShare;
      setActiveShares((prev) => [...prev, share]);
      return share;
    },
    [ownerToken]
  );

  const revokeShare = useCallback(
    async (debriefId: string, shareId: string) => {
      if (!ownerToken) throw new Error("Missing owner token");
      const res = await fetch(
        `/api/debriefs/${debriefId}/shares/${shareId}?ownerToken=${encodeURIComponent(ownerToken)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          humanizeDebriefApiError(data.error ?? "Could not revoke share")
        );
      }
      setActiveShares((prev) => prev.filter((s) => s.id !== shareId));
    },
    [ownerToken]
  );

  useEffect(() => {
    if (!activeDebrief?.id || !ownerToken) {
      setActiveShares([]);
      setSharesLoading(false);
      return;
    }
    void loadShares(activeDebrief.id);
  }, [activeDebrief?.id, ownerToken, loadShares]);

  const clearDetailLoadError = useCallback(() => setDetailLoadError(null), []);

  return {
    debriefs,
    activeDebrief,
    activeId,
    loading,
    hookError,
    dismissHookError,
    detailLoading,
    detailLoadError,
    clearDetailLoadError,
    ownerToken,
    addDebrief,
    selectDebrief,
    updateDebrief,
    deleteDebrief,
    newDebrief,
    updateResult,
    updateNotes,
    updateChatHistory,
    updateMeetingType,
    updateResultField,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    togglePublic,
    refetch,
    activeShares,
    sharesLoading,
    loadShares,
    createShare,
    revokeShare,
  };
}

