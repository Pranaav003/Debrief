"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { DebriefShare, ShareRole } from "@/lib/types";

export type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  debriefId: string;
  debriefTitle: string;
  activeShares: DebriefShare[];
  sharesLoading: boolean;
  createShare: (debriefId: string, role: ShareRole, label?: string) => Promise<DebriefShare>;
  revokeShare: (debriefId: string, shareId: string) => Promise<void>;
};

function getShareUrl(slug: string): string {
  if (typeof window === "undefined") return `/share/${slug}`;
  return `${window.location.origin}/share/${slug}`;
}

const ROLE_META: Record<
  ShareRole,
  { label: string; badgeBg: string; badgeText: string; cardTitle: string; cardBody: string }
> = {
  viewer: {
    label: "Viewer",
    badgeBg: "#4b5563",
    badgeText: "#f9fafb",
    cardTitle: "👁 Viewer",
    cardBody: "Can read the debrief",
  },
  editor: {
    label: "Editor",
    badgeBg: "#3b82f6",
    badgeText: "#fff",
    cardTitle: "✏️ Editor",
    cardBody: "Can edit all sections",
  },
};

function formatCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export function ShareModal({
  isOpen,
  onClose,
  debriefId,
  debriefTitle: _debriefTitle,
  activeShares,
  sharesLoading,
  createShare,
  revokeShare,
}: ShareModalProps) {
  void _debriefTitle;
  const [createRole, setCreateRole] = useState<ShareRole>("viewer");
  const [creating, setCreating] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPendingRevokeId(null);
      setActionError(null);
      setSuccessFlash(false);
    }
  }, [isOpen]);

  const flashCopied = useCallback((slug: string) => {
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 1500);
  }, []);

  async function onCopy(slug: string) {
    try {
      await navigator.clipboard.writeText(getShareUrl(slug));
      flashCopied(slug);
    } catch {
      setActionError("Could not copy to clipboard.");
    }
  }

  async function onCreate() {
    setActionError(null);
    setCreating(true);
    try {
      const share = await createShare(debriefId, createRole);
      await navigator.clipboard.writeText(getShareUrl(share.slug));
      flashCopied(share.slug);
      setSuccessFlash(true);
      window.setTimeout(() => setSuccessFlash(false), 3500);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not create link.");
    } finally {
      setCreating(false);
    }
  }

  async function confirmRevoke(shareId: string) {
    setActionError(null);
    setRevokingId(shareId);
    try {
      await revokeShare(debriefId, shareId);
      setPendingRevokeId(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not revoke link.");
    } finally {
      setRevokingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 mt-auto flex max-h-[90vh] w-full max-w-[500px] flex-col overflow-hidden rounded-t-2xl border border-[#2a2a2a] border-b-0 bg-[#141414] shadow-xl md:mt-0 md:max-h-[min(90vh,800px)] md:rounded-xl md:border-b"
        style={{ background: "#141414" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div className="h-1.5 w-10 rounded-full bg-zinc-600" aria-hidden />
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 transition hover:bg-[#1a1a1a] hover:text-zinc-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 id="share-modal-title" className="font-heading pr-10 text-lg font-semibold text-zinc-100">
          Share Debrief
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Anyone with a link can access this debrief based on their role
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(["viewer", "editor"] as const).map((role) => (
            <div
              key={role}
              className="rounded-lg border border-[#2a2a2a] p-3 text-xs leading-snug text-zinc-400"
              style={{ background: "#0f0f0f", borderRadius: 8, padding: 12, fontSize: 12 }}
            >
              <p className="font-semibold text-zinc-200">{ROLE_META[role].cardTitle}</p>
              <p className="mt-1 text-zinc-500">{ROLE_META[role].cardBody}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Active links
          </h3>
          {successFlash ? (
            <p className="mb-2 text-sm text-emerald-400" role="status">
              Link created and copied!
            </p>
          ) : null}
          {actionError ? (
            <div className="mb-2">
              <ErrorMessage type="error" message={actionError} onDismiss={() => setActionError(null)} />
            </div>
          ) : null}

          {sharesLoading ? (
            <div className="space-y-2">
              <div className="h-14 animate-pulse rounded-lg bg-[#1a1a1a]" />
              <div className="h-14 animate-pulse rounded-lg bg-[#1a1a1a]" />
            </div>
          ) : activeShares.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No active share links.
              <br />
              Create one below to share this debrief.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeShares.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-semibold"
                      style={{
                        background: ROLE_META[s.role].badgeBg,
                        color: ROLE_META[s.role].badgeText,
                      }}
                    >
                      {ROLE_META[s.role].label}
                    </span>
                    <span
                      className="font-mono text-sm text-zinc-500"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    >
                      {s.slug}
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void onCopy(s.slug)}
                        className="rounded border border-[#2a2a2a] px-2 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-[#1a1a1a]"
                      >
                        {copiedSlug === s.slug ? "Copied!" : "Copy"}
                      </button>
                      {pendingRevokeId === s.id ? (
                        <span className="flex flex-wrap items-center gap-1 text-xs text-zinc-400">
                          Revoke this link?
                          <button
                            type="button"
                            disabled={revokingId === s.id}
                            onClick={() => void confirmRevoke(s.id)}
                            className="font-semibold text-red-400 hover:underline"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingRevokeId(null)}
                            className="text-zinc-300 hover:underline"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={revokingId === s.id}
                          onClick={() => setPendingRevokeId(s.id)}
                          className="text-xs font-semibold text-red-400/90 hover:text-red-300"
                        >
                          {revokingId === s.id ? (
                            <Loader2 className="inline h-3 w-3 animate-spin" />
                          ) : (
                            "Revoke"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">Created {formatCreatedAt(s.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 border-t border-[#2a2a2a] pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Create new link
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as ShareRole)}
              className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#3b82f6]/50"
              style={{
                color: createRole === "viewer" ? "#d1d5db" : "#93c5fd",
              }}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="button"
              disabled={creating}
              onClick={() => void onCreate()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create link
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
