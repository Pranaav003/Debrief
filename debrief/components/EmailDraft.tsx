"use client";

import { useState } from "react";
import type { FollowUpEmail } from "@/lib/types";

type EmailDraftProps = {
  email: FollowUpEmail;
};

export function EmailDraft({ email }: EmailDraftProps) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Follow-up email
        </h3>
        <button
          type="button"
          onClick={() => void copyEmail()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          {copied ? "Copied" : "Copy email"}
        </button>
      </div>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Subject
        </p>
        <p className="mt-1 text-sm font-medium">{email.subject}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Body
        </p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800">
          {email.body}
        </pre>
      </div>
    </div>
  );
}
