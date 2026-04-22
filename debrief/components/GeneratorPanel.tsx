"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DailyLimitMessage } from "@/components/DailyLimitMessage";
import { PipelineProgress } from "@/components/PipelineProgress";
import { TranscriptInput } from "@/components/TranscriptInput";
import { UploadZone } from "@/components/UploadZone";
import { EXAMPLE_TRANSCRIPT } from "@/lib/example-transcript";
import type { PipelineStep } from "@/lib/pipeline";
import { isRateLimitThrown, rateLimitUserMessage, retryAfterFromJson } from "@/lib/rateLimitClient";
import { parseDeBriefResult, type DebriefResult } from "@/lib/types";

type InputMode = "paste" | "audio";

type GeneratorPanelProps = {
  onGenerated: (transcript: string, result: DebriefResult) => Promise<void>;
  ownerToken: string;
  prefillTranscript?: string | null;
  prefillNonce?: number;
};

type LimitData = {
  current: number;
  limit: number;
  resetsAt: string;
};

function delay(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

function summarizeErrorMessage(status: number, raw: unknown, fallback: string): string {
  const errText =
    typeof raw === "object" &&
    raw !== null &&
    "error" in raw &&
    typeof (raw as { error: unknown }).error === "string"
      ? (raw as { error: string }).error
      : "";

  if (status === 429) {
    return rateLimitUserMessage(retryAfterFromJson(raw));
  }
  if (status === 400 && /doesn't look like a meeting transcript|invalid_input/i.test(errText)) {
    return "This doesn't look like a meeting transcript. Paste a real transcript to continue.";
  }
  if (status >= 500 || status === 502 || status === 503) {
    return "AI service is temporarily unavailable. Please try again in a moment.";
  }
  if (fallback === "network") {
    return "Connection lost. Check your internet and try again.";
  }
  return errText || "Something went wrong. Please try again.";
}

function transcribeErrorMessage(status: number, raw: unknown, err: unknown): string {
  const errText =
    typeof raw === "object" &&
    raw !== null &&
    "error" in raw &&
    typeof (raw as { error: unknown }).error === "string"
      ? (raw as { error: string }).error
      : "";

  if (status === 429) {
    return rateLimitUserMessage(retryAfterFromJson(raw));
  }
  if (status === 400) {
    if (/25\s*MB|too large|large/i.test(errText)) {
      return "Audio file is too large. Maximum size is 25MB.";
    }
    return errText || "Unsupported file type. Please upload an MP3, MP4, M4A, or WAV file.";
  }
  if (status >= 500) {
    return "AI service is temporarily unavailable. Please try again in a moment.";
  }
  if (isNetworkErrorClient(err)) {
    return "Connection lost. Check your internet and try again.";
  }
  return errText || "Something went wrong. Please try again.";
}

function isNetworkErrorClient(e: unknown): boolean {
  return e instanceof TypeError || (e instanceof Error && /network|fetch|load/i.test(e.message));
}

export function GeneratorPanel({
  onGenerated,
  ownerToken,
  prefillTranscript,
  prefillNonce,
}: GeneratorPanelProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadSizeError, setUploadSizeError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<PipelineStep | null>(null);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [exampleLoadedTip, setExampleLoadedTip] = useState(false);
  const [limitData, setLimitData] = useState<LimitData | null>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const stepRef = useRef<PipelineStep>("idle");

  const setStep = useCallback((p: PipelineStep) => {
    stepRef.current = p;
    setPipelineStep(p);
  }, []);

  const busy =
    pipelineStep !== "idle" &&
    pipelineStep !== "error" &&
    !(pipelineStep === "done");

  const resetToIdle = useCallback(() => {
    setStep("idle");
    setPipelineError(null);
    setFailedStep(null);
  }, [setStep]);

  const runSummarize = useCallback(async (text: string): Promise<DebriefResult> => {
    let res: Response;
    try {
      res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, ownerToken }),
      });
    } catch {
      throw new Error(summarizeErrorMessage(0, null, "network"));
    }
    const raw: unknown = await res.json();
    if (res.status === 429) {
      throw {
        __rateLimit: true as const,
        message: rateLimitUserMessage(retryAfterFromJson(raw)),
      };
    }
    if (res.status === 403) {
      const isLimit =
        typeof raw === "object" &&
        raw !== null &&
        "error" in raw &&
        (raw as { error: unknown }).error === "daily_limit_reached";
      if (isLimit) {
        const limitPayload = raw as Record<string, unknown>;
        throw {
          __dailyLimit: true as const,
          current:
            typeof limitPayload.current === "number"
              ? limitPayload.current
              : 0,
          limit:
            typeof limitPayload.limit === "number"
              ? limitPayload.limit
              : 10,
          resetsAt:
            typeof limitPayload.resetsAt === "string"
              ? limitPayload.resetsAt
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      }
    }
    if (!res.ok) {
      throw new Error(summarizeErrorMessage(res.status, raw, ""));
    }
    const parsed = parseDeBriefResult(raw);
    if (!parsed) {
      throw new Error("AI service is temporarily unavailable. Please try again in a moment.");
    }
    return parsed;
  }, [ownerToken]);

  function loadExampleTranscript() {
    const text = EXAMPLE_TRANSCRIPT;
    if (typeof text !== "string" || text.length === 0) {
      setPipelineError("Example transcript could not be loaded.");
      setFailedStep("validating");
      setStep("error");
      return;
    }
    setTranscript(text);
    setPipelineError(null);
    setLimitData(null);
    setStep("idle");
    setExampleLoadedTip(true);
    window.setTimeout(() => setExampleLoadedTip(false), 4000);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = transcriptRef.current;
        if (!el) return;
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  useEffect(() => {
    if (!prefillTranscript?.trim()) return;
    setMode("paste");
    setTranscript(prefillTranscript);
    setLimitData(null);
    setPipelineError(null);
    setFailedStep(null);
    const timer = window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [prefillTranscript, prefillNonce]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPipelineError(null);
    setFailedStep(null);
    setLimitData(null);

    if (mode === "paste") {
      setStep("validating");
      await delay(80);
      const trimmed = transcript.trim();
      if (!trimmed) {
        setPipelineError("Paste a transcript or switch to audio upload.");
        setFailedStep("validating");
        setStep("error");
        return;
      }

      setIsAudioMode(false);
      setStep("classifying");
      const genTimer = window.setTimeout(() => setStep("generating"), 3000);

      try {
        const result = await runSummarize(trimmed);
        window.clearTimeout(genTimer);
        setStep("saving");
        await onGenerated(trimmed, result);
        setStep("done");
        window.setTimeout(() => resetToIdle(), 1500);
      } catch (err) {
        window.clearTimeout(genTimer);
        setFailedStep(stepRef.current);
        setStep("error");
        if (isRateLimitThrown(err)) {
          setPipelineError(err.message);
        } else if (
          typeof err === "object" &&
          err !== null &&
          "__dailyLimit" in err &&
          (err as { __dailyLimit?: unknown }).__dailyLimit === true
        ) {
          const limitErr = err as Record<string, unknown>;
          setLimitData({
            current: typeof limitErr.current === "number" ? limitErr.current : 0,
            limit: typeof limitErr.limit === "number" ? limitErr.limit : 10,
            resetsAt:
              typeof limitErr.resetsAt === "string"
                ? limitErr.resetsAt
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
          setStep("idle");
          setFailedStep(null);
          setPipelineError(null);
        } else {
          setPipelineError(
            err instanceof Error ? err.message : "Something went wrong. Please try again."
          );
        }
      }
      return;
    }

    setStep("validating");
    await delay(50);
    if (!audioFile) {
      setPipelineError("Choose an audio file under 25 MB.");
      setFailedStep("validating");
      setStep("error");
      return;
    }

    setIsAudioMode(true);
    setStep("uploading");
    await delay(100);
    setStep("transcribing");

    const formData = new FormData();
    formData.set("audio", audioFile);
    let tRes: Response;
    try {
      tRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      setFailedStep(stepRef.current);
      setStep("error");
      setPipelineError(transcribeErrorMessage(0, null, e));
      return;
    }

    const tJson: unknown = await tRes.json();
    if (tRes.status === 429) {
      setFailedStep(stepRef.current);
      setStep("error");
      setPipelineError(rateLimitUserMessage(retryAfterFromJson(tJson)));
      return;
    }
    if (!tRes.ok) {
      setFailedStep(stepRef.current);
      setStep("error");
      setPipelineError(transcribeErrorMessage(tRes.status, tJson, null));
      return;
    }

    const nextTranscript =
      typeof tJson === "object" &&
      tJson !== null &&
      "transcript" in tJson &&
      typeof (tJson as { transcript: unknown }).transcript === "string"
        ? (tJson as { transcript: string }).transcript.trim()
        : "";
    if (!nextTranscript) {
      setFailedStep("transcribing");
      setStep("error");
      setPipelineError("AI service is temporarily unavailable. Please try again in a moment.");
      return;
    }

    setStep("classifying");
    await delay(80);
    const genTimer = window.setTimeout(() => setStep("generating"), 3000);

    try {
      const result = await runSummarize(nextTranscript);
      window.clearTimeout(genTimer);
      setStep("saving");
      await onGenerated(nextTranscript, result);
      setStep("done");
      window.setTimeout(() => resetToIdle(), 1500);
    } catch (err) {
      window.clearTimeout(genTimer);
      setFailedStep(stepRef.current);
      setStep("error");
      if (isRateLimitThrown(err)) {
        setPipelineError(err.message);
      } else if (
        typeof err === "object" &&
        err !== null &&
        "__dailyLimit" in err &&
        (err as { __dailyLimit?: unknown }).__dailyLimit === true
      ) {
        const limitErr = err as Record<string, unknown>;
        setLimitData({
          current: typeof limitErr.current === "number" ? limitErr.current : 0,
          limit: typeof limitErr.limit === "number" ? limitErr.limit : 10,
          resetsAt:
            typeof limitErr.resetsAt === "string"
              ? limitErr.resetsAt
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        setStep("idle");
        setFailedStep(null);
        setPipelineError(null);
      } else {
        setPipelineError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      }
    }
  }

  const showPipeline = pipelineStep !== "idle";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto transition-opacity duration-200 ease-out">
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
        <header className="flex flex-col items-center overflow-visible px-1 sm:px-0">
          <h1 className="font-heading text-center text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            DeBrief
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-zinc-500 sm:text-lg">
            Value in text. Paste in a meeting transcript or upload an audio to
            get personalized insights and action items with DeBrief.
          </p>
        </header>

        <form
          ref={formRef}
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-8 space-y-6 md:mt-10 md:space-y-8"
        >
          <div
            role="tablist"
            aria-label="Input mode"
            className="grid w-full grid-cols-2 gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "paste"}
              disabled={busy}
              onClick={() => {
                setMode("paste");
                setPipelineError(null);
                setLimitData(null);
                setStep("idle");
              }}
              className={`flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-medium transition ${
                mode === "paste"
                  ? "bg-accent text-white"
                  : "bg-[#141414] text-zinc-400 ring-1 ring-[#2a2a2a] hover:text-zinc-200"
              } disabled:opacity-50`}
            >
              Paste transcript
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "audio"}
              disabled={busy}
              onClick={() => {
                setMode("audio");
                setPipelineError(null);
                setLimitData(null);
                setStep("idle");
              }}
              className={`flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-medium transition ${
                mode === "audio"
                  ? "bg-accent text-white"
                  : "bg-[#141414] text-zinc-400 ring-1 ring-[#2a2a2a] hover:text-zinc-200"
              } disabled:opacity-50`}
            >
              Upload audio
            </button>
          </div>

          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414]/50 p-4 sm:p-8">
            {mode === "paste" ? (
              <>
                <TranscriptInput
                  ref={transcriptRef}
                  value={transcript}
                  onChange={setTranscript}
                  disabled={busy}
                />
                <div className="mt-3 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => loadExampleTranscript()}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-blue-400 ring-1 ring-blue-500/40 transition hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Load example transcript
                  </button>
                  {exampleLoadedTip ? (
                    <p
                      className="text-center text-xs text-emerald-400/90 sm:text-left"
                      role="status"
                      aria-live="polite"
                    >
                      Example loaded — edit if you like, then generate.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <UploadZone
                file={audioFile}
                onFileChange={setAudioFile}
                disabled={busy}
                sizeError={uploadSizeError}
                onSizeError={setUploadSizeError}
              />
            )}

            {showPipeline ? (
              <div className="mt-6">
                <PipelineProgress
                  currentStep={pipelineStep}
                  isAudio={isAudioMode}
                  error={pipelineError}
                  failedStep={failedStep}
                  onRetry={pipelineStep === "error" ? resetToIdle : undefined}
                />
              </div>
            ) : limitData ? (
              <DailyLimitMessage
                current={limitData.current}
                limit={limitData.limit}
                resetsAt={limitData.resetsAt}
                onDismiss={() => setLimitData(null)}
              />
            ) : (
              <button
                type="submit"
                disabled={busy}
                className="mt-6 flex h-14 min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-accent text-base font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generate DeBrief
              </button>
            )}
          </div>
        </form>
      </div>

      <footer className="shrink-0 border-t border-[#2a2a2a] py-8 text-center">
        <p className="text-sm text-zinc-500">
          Building 12 products in 12 months. Product 3.
        </p>
        <a
          href="https://www.instagram.com/life.of.pranaav/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-accent"
          aria-label="Instagram @life.of.pranaav"
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span>@life.of.pranaav</span>
        </a>
        <p className="mt-3 text-xs text-zinc-600">Made by Pranaav.</p>
      </footer>
    </div>
  );
}
