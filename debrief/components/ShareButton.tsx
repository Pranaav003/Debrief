"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { ShareModal } from "@/components/ShareModal";
import type { DebriefShare, ShareRole } from "@/lib/types";

export type ShareButtonProps = {
  debriefId: string;
  debriefTitle: string;
  hasActiveShares: boolean;
  activeShares: DebriefShare[];
  sharesLoading: boolean;
  createShare: (debriefId: string, role: ShareRole, label?: string) => Promise<DebriefShare>;
  revokeShare: (debriefId: string, shareId: string) => Promise<void>;
};

export function ShareButton({
  debriefId,
  debriefTitle,
  hasActiveShares,
  activeShares,
  sharesLoading,
  createShare,
  revokeShare,
}: ShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`share-btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition md:w-auto ${
          hasActiveShares
            ? "share-btn--active border-[#16a34a] bg-[#14532d22] text-[#4ade80]"
            : "border-[#2a2a2a] bg-[#141414] text-zinc-200 hover:border-accent hover:text-white"
        }`}
      >
        <Link2 size={14} />
        {hasActiveShares ? "Shared" : "Share"}
      </button>

      <ShareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        debriefId={debriefId}
        debriefTitle={debriefTitle}
        activeShares={activeShares}
        sharesLoading={sharesLoading}
        createShare={createShare}
        revokeShare={revokeShare}
      />
    </>
  );
}
