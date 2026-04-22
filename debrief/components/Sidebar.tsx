"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Debrief } from "@/lib/types";
import { formatFullDeBriefText } from "@/lib/format-debrief-text";
import { DebriefSkeleton } from "@/components/DebriefSkeleton";

type SidebarProps = {
  debriefs: Debrief[];
  /** Initial list fetch in progress (no cached rows yet). */
  listLoading?: boolean;
  activeId: string | null;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClearHistory: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  ownerToken: string;
};

const MENU_W = 232;

function sortDebriefsStable(list: Debrief[]): Debrief[] {
  return list
    .map((d, index) => ({ d, index }))
    .sort((a, b) => {
      const ap = a.d.pinned ? 1 : 0;
      const bp = b.d.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return a.index - b.index;
    })
    .map(({ d }) => d);
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.1V17h14v-1.9a2 2 0 0 0-1.11-1.65l-1.78-.9A2 2 0 0 1 12 10.76V7a2 2 0 0 0 2-2V4H9v1a2 2 0 0 0 2 2v3.76z" />
    </svg>
  );
}

/** Compact pin for sidebar row badge */
function IconPinBadge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.1V17h14v-1.9a2 2 0 0 0-1.11-1.65l-1.78-.9A2 2 0 0 1 12 10.76V7a2 2 0 0 0 2-2V4H9v1a2 2 0 0 0 2 2v3.76z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function IconDots({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function Sidebar({
  debriefs,
  listLoading = false,
  activeId,
  mobileOpen,
  onMobileClose,
  onSelect,
  onNew,
  onClearHistory,
  onRename,
  onDelete,
  onTogglePin,
  ownerToken,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  const sortedDebriefs = useMemo(
    () => sortDebriefsStable(debriefs),
    [debriefs]
  );

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuPos(null);
  }, []);

  const commitRename = useCallback(() => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    if (renamingId === null) return;
    const id = renamingId;
    const original =
      debriefs.find((x) => x.id === id)?.meetingTitle?.trim() ?? "";
    const next = draftTitle.trim();
    if (next && next !== original) {
      onRename(id, next);
    }
    setRenamingId(null);
    setDraftTitle("");
  }, [renamingId, draftTitle, debriefs, onRename]);

  const cancelRename = useCallback(() => {
    skipBlurCommitRef.current = true;
    setRenamingId(null);
    setDraftTitle("");
  }, []);

  useEffect(() => {
    if (renamingId === null) return;
    const id = requestAnimationFrame(() => {
      const el = renameInputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(id);
  }, [renamingId]);

  useEffect(() => {
    if (!ownerToken) return;
    let cancelled = false;
    void fetch(`/api/usage/daily?ownerToken=${encodeURIComponent(ownerToken)}`)
      .then((r) => r.json())
      .then((d: unknown) => {
        if (cancelled || typeof d !== "object" || d === null) return;
        const count =
          "count" in (d as Record<string, unknown>) &&
          typeof (d as { count?: unknown }).count === "number"
            ? (d as { count: number }).count
            : 0;
        const limit =
          "limit" in (d as Record<string, unknown>) &&
          typeof (d as { limit?: unknown }).limit === "number"
            ? (d as { limit: number }).limit
            : 10;
        setDailyCount(Math.max(0, count));
        setDailyLimit(Math.max(1, limit));
      })
      .catch(() => {
        if (cancelled) return;
        setDailyCount(0);
        setDailyLimit(10);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerToken, debriefs.length]);

  useEffect(() => {
    if (!openMenuId) return;
    function onPointerDown(e: MouseEvent) {
      if (openMenuId === null) return;
      const t = e.target as Node;
      const btn = menuButtonRefs.current[openMenuId];
      const menu = document.getElementById(`debrief-menu-${openMenuId}`);
      if (menu?.contains(t) || btn?.contains(t)) return;
      closeMenu();
    }
    function onScroll() {
      closeMenu();
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [openMenuId, closeMenu]);

  function openMenuFor(id: string, anchor: HTMLButtonElement) {
    const r = anchor.getBoundingClientRect();
    let left = r.right - MENU_W;
    const pad = 8;
    if (left < pad) left = pad;
    if (left + MENU_W > window.innerWidth - pad) {
      left = window.innerWidth - MENU_W - pad;
    }
    const top = Math.min(r.bottom + 4, window.innerHeight - 280);
    setMenuPos({ top, left });
    setOpenMenuId(id);
  }

  async function handleShare(d: Debrief) {
    const text = formatFullDeBriefText(d.result);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: d.meetingTitle || "DeBrief",
            text,
          });
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            closeMenu();
            return;
          }
          await navigator.clipboard.writeText(text);
        }
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* ignore */
      }
    }
    closeMenu();
  }

  function startInlineRename(d: Debrief) {
    closeMenu();
    setDraftTitle(d.meetingTitle || "");
    setRenamingId(d.id);
  }

  function handleDelete(id: string) {
    closeMenu();
    if (
      typeof window !== "undefined" &&
      window.confirm("Delete this debrief? This cannot be undone.")
    ) {
      onDelete(id);
    }
  }

  function handleSelect(id: string) {
    onSelect(id);
    onMobileClose();
  }

  function handleNew() {
    onNew();
    onMobileClose();
  }

  const menuDebrief =
    openMenuId !== null
      ? debriefs.find((x) => x.id === openMenuId)
      : undefined;
  const usagePercent = Math.min(100, (dailyCount / dailyLimit) * 100);
  const usageFillColor =
    dailyCount >= dailyLimit ? "#dc2626" : dailyCount >= 7 ? "#ca8a04" : "#3b82f6";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[100vw] flex-col border-r border-[#1a1a1a] bg-[#0f0f0f] transition-transform duration-[250ms] ease-out md:static md:z-0 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      aria-label="Debrief history"
    >
      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-4">
        <p className="font-heading text-lg font-bold tracking-tight text-zinc-100">
          Debrief
        </p>
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-[#1a1a1a] hover:text-zinc-100 md:hidden"
        >
          <span className="text-2xl leading-none" aria-hidden>
            ×
          </span>
        </button>
      </div>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={() => handleNew()}
          className="flex min-h-12 w-full items-center justify-center rounded-lg border border-[#2a2a2a] bg-transparent py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-[#1a1a1a]"
        >
          New Debrief
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {listLoading && debriefs.length === 0 ? (
          <DebriefSkeleton />
        ) : debriefs.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zinc-500">
            No debriefs yet. Generate your first one.
          </p>
        ) : (
          <ul className="space-y-1">
            {sortedDebriefs.map((d) => {
              const active = d.id === activeId;
              const isRenaming = renamingId === d.id;
              return (
                <li key={d.id} className="group relative">
                  <div
                    className={`flex items-start gap-1 rounded-lg pr-1 transition-colors duration-200 ${
                      active
                        ? "border-l-[3px] border-l-[#3b82f6] bg-[#1e2a3a] pl-[9px]"
                        : "border-l-[3px] border-l-transparent hover:bg-[#1a1a1a]"
                    }`}
                  >
                    {isRenaming ? (
                      <div className="min-w-0 flex-1 px-2 py-2">
                        <input
                          ref={renameInputRef}
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelRename();
                            }
                          }}
                          onBlur={() => commitRename()}
                          aria-label="Rename meeting"
                          className="w-full rounded-full border-0 bg-[#2a2a2a] px-3 py-2 text-sm font-medium text-white outline-none ring-2 ring-blue-500/40 selection:bg-blue-600/50 selection:text-white"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelect(d.id)}
                        className="min-h-12 min-w-0 flex-1 px-3 py-3 text-left"
                      >
                        <div className="flex items-start gap-2">
                          {d.pinned ? (
                            <span
                              className="mt-0.5 shrink-0 text-zinc-400"
                              title="Pinned"
                              aria-hidden
                            >
                              <IconPinBadge />
                            </span>
                          ) : null}
                          <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium text-zinc-200">
                            {d.meetingTitle || "Untitled meeting"}
                          </span>
                        </div>
                        {d.date ? (
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {d.date}
                          </span>
                        ) : null}
                      </button>
                    )}
                    {!isRenaming ? (
                      <button
                        type="button"
                        ref={(el) => {
                          menuButtonRefs.current[d.id] = el;
                        }}
                        aria-label="Meeting options"
                        aria-expanded={openMenuId === d.id}
                        aria-haspopup="menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuId === d.id) {
                            closeMenu();
                          } else {
                            openMenuFor(d.id, e.currentTarget);
                          }
                        }}
                        className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-500 opacity-70 transition hover:bg-black/20 hover:text-zinc-300 group-hover:opacity-100"
                      >
                        <IconDots />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-[#1a1a1a] p-3">
        {dailyCount > 0 ? (
          <div className="mb-3">
            <div className="h-[3px] w-full rounded-[2px] bg-[#1a1a1a]">
              <div
                className="h-[3px] rounded-[2px] transition-all duration-300"
                style={{ width: `${usagePercent}%`, backgroundColor: usageFillColor }}
              />
            </div>
            <p
              className={`mt-1 text-center text-[11px] ${
                dailyCount >= dailyLimit ? "text-[#dc2626]" : "text-[#4b5563]"
              }`}
            >
              {dailyCount >= dailyLimit
                ? "Limit reached · Resets at midnight"
                : `${dailyCount}/${dailyLimit} debriefs today`}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              debriefs.length > 0 &&
              window.confirm(
                "Clear all debrief history? This cannot be undone."
              )
            ) {
              onClearHistory();
            }
          }}
          disabled={debriefs.length === 0}
          className="flex min-h-11 w-full items-center justify-center rounded-lg py-2 text-xs text-zinc-500 transition hover:text-zinc-300 disabled:opacity-40"
        >
          Clear history
        </button>
      </div>

      {openMenuId &&
        menuPos &&
        menuDebrief &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={`debrief-menu-${openMenuId}`}
            role="menu"
            className="fixed z-[100] overflow-hidden rounded-xl border border-[#3f3f3f] bg-[#2f2f2f] py-1.5 shadow-2xl"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: MENU_W,
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
              onClick={() => void handleShare(menuDebrief)}
            >
              <IconShare className="shrink-0 text-white" />
              Share
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
              onClick={() => startInlineRename(menuDebrief)}
            >
              <IconPencil className="shrink-0 text-white" />
              Rename
            </button>
            <div className="my-1.5 h-px bg-[#3f3f3f]" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
              onClick={() => {
                onTogglePin(menuDebrief.id);
                closeMenu();
              }}
            >
              <IconPin className="shrink-0 text-white" />
              {menuDebrief.pinned ? "Unpin chat" : "Pin chat"}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#ee6666] transition hover:bg-white/10"
              onClick={() => handleDelete(menuDebrief.id)}
            >
              <IconTrash className="shrink-0 text-[#ee6666]" />
              Delete
            </button>
          </div>,
          document.body
        )}
    </aside>
  );
}
