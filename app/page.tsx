"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AudioLines,
  Briefcase,
  ExternalLink,
  Handshake,
  Lightbulb,
  ListChecks,
  Mic,
  NotebookPen,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useInView } from "@/lib/useInView";

type Tab = "paste" | "audio";

const EXAMPLE = `00:00:07 Alex Chen: Okay let's run through where we are on the launch. Lena, design?

00:00:12 Lena: Landing page is done, waiting on legal to approve the copy. I'll have the email templates to you by Wednesday.

00:00:20 Alex Chen: Good. Jordan — backend?

00:00:24 Jordan Lee: API is stable, we fixed the rate limiting issue from last week. The one open thing is whether we log IP addresses on login — legal flagged it and I wasn't sure how to respond.

00:00:36 Alex Chen: I'll loop in Priya from security on that, she'll know. Sam — what's the Android situation?

00:00:44 Sam Rivera: The Android 13 crash is fixed, PR is up, should merge Thursday. The iOS build is clean.

00:00:52 Alex Chen: Okay. So decisions — we're cutting offline mode from v1, online only. And we're deferring the push notification feature until we have the legal answer.

00:01:03 Jordan Lee: Agreed on both.

00:01:18 Alex Chen: Thanks all — same time next week.`;

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 500ms ease, transform 500ms ease",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [transcript, setTranscript] = useState("");
  const meetingTypes: { icon: LucideIcon; name: string; color: string; chips: string[] }[] = [
    { icon: Mic, name: "Standup", color: "#7c3aed", chips: ["Shipped", "Blockers", "Up Next"] },
    {
      icon: Handshake,
      name: "Sales Call",
      color: "#16a34a",
      chips: ["Pain Points", "Objections", "Deal Signal"],
    },
    {
      icon: Lightbulb,
      name: "Brainstorm",
      color: "#ea580c",
      chips: ["Ideas Generated", "Shortlisted", "Killed"],
    },
    {
      icon: UserRound,
      name: "1:1",
      color: "#0891b2",
      chips: ["Feedback Themes", "Commitments", "Mood"],
    },
    {
      icon: Briefcase,
      name: "Board Review",
      color: "#dc2626",
      chips: ["Metrics", "Risks", "Strategic Decisions"],
    },
    {
      icon: Users,
      name: "General Sync",
      color: "#3b82f6",
      chips: ["Decisions", "Action Items", "Open Questions"],
    },
  ];
  const features: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: NotebookPen,
      title: "Smart Detection",
      body: "Automatically identifies standup, sales call, brainstorm, 1:1, board review, or general sync.",
    },
    {
      icon: ShieldCheck,
      title: "Shareable Links",
      body: "Share with viewer or editor permissions. Every link can be revoked independently.",
    },
    {
      icon: ListChecks,
      title: "Ask Anything",
      body: "Chat with your meeting after the fact. Ask who owns what, what was decided, what was left open.",
    },
    {
      icon: AudioLines,
      title: "Email the Debrief",
      body: "Send a formatted HTML email to your team directly from Debrief.",
    },
    {
      icon: NotebookPen,
      title: "Fully Editable",
      body: "Edit summaries, reassign action items, add notes — all saved automatically.",
    },
    {
      icon: ShieldCheck,
      title: "Private by Default",
      body: "Your debriefs are private until you choose to share them.",
    },
  ];

  function handleGenerate() {
    const trimmed = transcript.trim();
    if (!trimmed) return;
    sessionStorage.setItem("debrief_prefill", trimmed);
    router.push("/app");
  }

  return (
    <main className="bg-[#080808] text-[#f5f5f5]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1a1a1a] bg-[rgba(8,8,8,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between px-5">
          <a href="#" className="font-heading text-[20px] font-bold text-white">
            Debrief
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-[#6b7280] transition hover:text-white">
              How it works
            </a>
            <a href="#roadmap" className="text-sm text-[#6b7280] transition hover:text-white">
              Roadmap
            </a>
          </nav>
          <Link
            href="/app"
            className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
          >
            Try free →
          </Link>
        </div>
      </header>

      <section
        className="min-h-screen px-5 pt-28"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59, 130, 246, 0.12), transparent)",
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="[font-family:var(--font-space-mono)] text-xs uppercase tracking-[0.2em] text-[#3b82f6]">
            Meetings → Clarity
          </p>
          <h1 className="mt-5 font-heading text-[40px] font-extrabold leading-[1.05] md:text-[72px]">
            Your meetings deserve
            <br />
            <span
              style={{
                textDecoration: "underline",
                textDecorationColor: "#3b82f6",
                textUnderlineOffset: "6px",
                textDecorationThickness: "3px",
              }}
            >
              better
            </span>{" "}
            than notes.
          </h1>
          <p className="mx-auto mt-6 max-w-[480px] text-lg text-[#9ca3af]">
            Paste a transcript below and see what Debrief does. No account needed.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-[720px] rounded-2xl border border-[#222222] bg-[#111111] p-6 shadow-[0_0_0_1px_#222,0_32px_64px_rgba(0,0,0,0.4)]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activeTab === "paste"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#141414] text-zinc-400 ring-1 ring-[#2a2a2a]"
              }`}
            >
              Paste transcript
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("audio")}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activeTab === "audio"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#141414] text-zinc-400 ring-1 ring-[#2a2a2a]"
              }`}
            >
              Upload audio
            </button>
          </div>

          {activeTab === "paste" ? (
            <>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="00:00 Alex: We need to decide on the launch date before end of week..."
                className="mt-4 min-h-[160px] w-full resize-y rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 text-sm text-[#d1d5db] outline-none focus:border-[#3b82f6]"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setTranscript(EXAMPLE)}
                  className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-sm text-[#9ca3af] transition hover:text-white"
                >
                  Load example
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2563eb]"
                >
                  Generate Debrief →
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center">
              <AudioLines className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
              <p className="text-sm text-[#9ca3af]">
                Audio upload is available in the full app →
              </p>
              <Link
                href="/app"
                className="mt-4 inline-flex rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
              >
                Open full app
              </Link>
            </div>
          )}
        </div>

        <p className="pb-16 pt-4 text-center text-xs text-[#4b5563]">
          Free to use · No account needed · Works with Zoom, Meet, Teams, or any transcript
        </p>
      </section>

      <section id="problem" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <h2 className="text-center font-heading text-[28px] font-bold md:text-[44px]">
            Every meeting ends the same way.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["😮‍💨", "Notes go nowhere", "You write them, close the doc, and never look at them again."],
            ["❓", "Nobody owns anything", "Action items get mentioned but never assigned."],
            ["🔄", "Same meeting next week", "Because nothing from last week actually got done."],
          ].map(([emoji, title, body], i) => (
            <Reveal key={title} delay={i * 100}>
              <article className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <div className="text-3xl">{emoji}</div>
                <h3 className="mt-3 font-heading text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[#6b7280]">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mx-auto mt-10 h-px w-20 bg-[#3b82f6]" />
        <p className="mt-5 text-center font-heading text-3xl">There&apos;s a better way.</p>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <p className="[font-family:var(--font-space-mono)] text-xs uppercase tracking-[0.2em] text-[#3b82f6]">How it works</p>
          <h2 className="mt-4 font-heading text-[28px] font-bold md:text-[44px]">
            From meeting to debrief
            <br />
            in 30 seconds.
          </h2>
        </Reveal>
        <div className="relative mt-10 grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-8 hidden border-t border-dashed border-[#2a2a2a] md:block" />
          {[
            ["01", "Paste or upload", "Drop in a transcript from Zoom, Google Meet, Teams, or any platform. Or upload an audio file directly."],
            ["02", "AI extracts everything", "Debrief detects your meeting type and pulls out decisions, action items, open questions, and a follow-up email draft."],
            ["03", "Share and act", "Send the debrief to your team via email, share a link with viewer or editor access, or ask follow-up questions about the meeting."],
          ].map(([num, title, body], i) => (
            <Reveal key={title} delay={i * 150}>
              <article className="relative rounded-xl border border-[#222222] bg-[#111111] p-6">
                <p className="[font-family:var(--font-space-mono)] text-[56px] leading-none text-[#1e3a5f]">{num}</p>
                <h3 className="relative z-10 -mt-5 font-heading text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm text-[#6b7280]">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="meeting-types" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <h2 className="font-heading text-[28px] font-bold md:text-[44px]">
            Built for every kind of meeting.
          </h2>
          <p className="mt-3 text-[17px] text-[#6b7280]">
            Debrief detects your meeting type automatically and structures the output accordingly.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetingTypes.map((item, i) => {
            const Icon = item.icon;
            return (
            <Reveal key={item.name} delay={i * 80}>
              <article
                className="rounded-lg border border-[#222222] bg-[#111111] p-5"
                style={{ borderLeft: `3px solid ${item.color}` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                  <h3 className="font-heading text-base font-semibold">{item.name}</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded px-2 py-0.5 text-[11px]"
                      style={{
                        color: item.color,
                        backgroundColor: `${item.color}26`,
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          )})}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <h2 className="font-heading text-[28px] font-bold md:text-[44px]">
            Everything your team needs.
            <br />
            Nothing you don&apos;t.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
            <Reveal key={item.title} delay={i * 80}>
              <article className="border-b border-[#222222] pb-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-[#1a1a1a] p-2">
                    <Icon className="h-7 w-7 text-[#9ca3af]" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#6b7280]">{item.body}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          )})}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <h2 className="font-heading text-[28px] font-bold md:text-[44px]">
            Built for people who move fast.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Finally, meeting notes that actually tell you what happened.", "Founder, early user"],
            ["I sent the debrief link to my whole team before I even left the call.", "Ops Manager, early user"],
            ["The sales call output is the first thing I send to my manager after a demo.", "Account Executive, early user"],
          ].map(([quote, by], i) => (
            <Reveal key={by} delay={i * 100}>
              <article className="relative rounded-xl border border-[#222222] bg-[#111111] p-7">
                <span className="absolute left-4 top-1 font-heading text-6xl text-[#1e3a5f]">“</span>
                <p className="relative text-base italic leading-7 text-white">{quote}</p>
                <p className="mt-4 text-sm text-[#6b7280]">— {by}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <p className="[font-family:var(--font-space-mono)] text-xs uppercase tracking-[0.2em] text-[#3b82f6]">What&apos;s next</p>
          <h2 className="mt-4 font-heading text-[28px] font-bold md:text-[44px]">
            We&apos;re just getting started.
          </h2>
          <p className="mt-3 text-[#6b7280]">
            Debrief is actively in development. Here&apos;s what&apos;s coming.
          </p>
        </Reveal>
        <div className="relative mx-auto mt-10 max-w-2xl border-l border-[#222222] pl-8">
          {[
            ["Coming soon", "#f59e0b", "Zoom cloud recording import", "Connect your Zoom account and import recordings directly — no transcript copy-paste needed."],
            ["Coming soon", "#f59e0b", "Google Meet integration", "Pull transcripts directly from Google Meet recordings."],
            ["Coming soon", "#f59e0b", "Slack integration", "Post your debrief to a Slack channel automatically when your meeting ends."],
            ["Planned", "#374151", "Calendar integration", "Auto-detect upcoming meetings and send debriefs to attendees post-call."],
            ["Planned", "#374151", "Team workspaces", "Shared debrief history for your whole team in one place."],
            ["Planned", "#374151", "Action item tracking", "Track whether action items from past meetings actually got done."],
          ].map(([badge, color, title, body], i) => (
            <Reveal key={title as string} delay={i * 90}>
              <article className="relative mb-8">
                <span
                  className="absolute -left-[38px] top-2 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color as string }}
                />
                <span
                  className="rounded-full px-2 py-1 text-[11px]"
                  style={{ color: color as string, backgroundColor: `${color as string}1f` }}
                >
                  {badge as string}
                </span>
                <h3 className="mt-2 font-heading text-[17px] font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm text-[#6b7280]">{body as string}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-sm text-[#6b7280]">
          Have a feature request?{" "}
          <a href="mailto:dev@pranaaviyer.com" className="text-[#3b82f6] hover:underline">
            dev@pranaaviyer.com
          </a>
        </p>
      </section>

      <footer className="border-t border-[#1a1a1a]">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-5 py-12 md:flex-row md:items-start">
          <div className="flex flex-col gap-[6px]">
            <p className="font-heading text-[18px] font-bold text-white">Debrief</p>
            <p className="text-[14px] text-[#6b7280]">Turn meetings into clarity.</p>
            <div className="h-[16px]" />
            <p className="text-[13px] text-[#4b5563]">
              Part of the 12 products in 12 months experiment.
            </p>
            <a
              href="https://instagram.com/life.of.pranaav"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#3b82f6] no-underline transition hover:underline"
              aria-label="Instagram @life.of.pranaav"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              @life.of.pranaav
            </a>
          </div>
          <div className="flex flex-col gap-[6px] text-left md:text-right">
            <p className="text-[13px] text-[#6b7280]">© 2026 Debrief</p>
            <p className="text-[13px] text-[#6b7280]">debrief.pranaaviyer.com</p>
            <a
              className="text-[13px] text-[#3b82f6] hover:underline"
              href="mailto:dev@pranaaviyer.com"
            >
              dev@pranaaviyer.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
