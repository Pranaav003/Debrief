"use client";

import { Check, Loader2, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import {
  AUDIO_PIPELINE_STEPS,
  getStepProgress,
  PIPELINE_STEPS,
  TEXT_PIPELINE_STEPS,
  type PipelineStep,
  TIME_ESTIMATES,
} from "@/lib/pipeline";

const SHORT_LABEL: Partial<Record<PipelineStep, string>> = {
  validating: "Val",
  uploading: "Up",
  transcribing: "Trans",
  classifying: "Det",
  generating: "Gen",
  saving: "Save",
  done: "Done",
};

function stepConfig(step: PipelineStep) {
  return PIPELINE_STEPS.find((s) => s.key === step);
}

export type PipelineProgressProps = {
  currentStep: PipelineStep;
  isAudio: boolean;
  error?: string | null;
  failedStep?: PipelineStep | null;
  onRetry?: () => void;
};

export function PipelineProgress({
  currentStep,
  isAudio,
  error,
  failedStep,
  onRetry,
}: PipelineProgressProps) {
  const steps = isAudio ? AUDIO_PIPELINE_STEPS : TEXT_PIPELINE_STEPS;
  const [microProgress, setMicroProgress] = useState(0);

  const isError = currentStep === "error";
  const isDone = currentStep === "done";

  const progressIndex = steps.indexOf(currentStep);
  const failIdx = failedStep ? steps.indexOf(failedStep) : -1;

  useEffect(() => {
    if (currentStep === "idle") return;
    if (currentStep === "done") {
      setMicroProgress(100);
      return;
    }
    if (currentStep === "error") return;

    const config = stepConfig(currentStep);
    if (!config) return;

    const baseProgress = getStepProgress(currentStep, isAudio);
    const nextIndex = steps.indexOf(currentStep) + 1;
    const nextStep = nextIndex < steps.length ? steps[nextIndex] : null;
    const nextProgress = nextStep ? getStepProgress(nextStep, isAudio) : 100;
    const range = nextProgress - baseProgress;
    const targetProgress = baseProgress + range * 0.8;
    const duration = Math.max(config.estimatedSeconds * 1000, 400);

    setMicroProgress(baseProgress);

    const startTime = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - fraction) ** 3;
      setMicroProgress(baseProgress + (targetProgress - baseProgress) * eased);
      if (fraction >= 1) window.clearInterval(interval);
    }, 50);

    return () => window.clearInterval(interval);
  }, [currentStep, isAudio, steps]);

  const barWidth = Math.min(100, Math.max(0, microProgress));
  const barColorClass = isDone
    ? "bg-[#22c55e]"
    : isError
      ? "bg-[#dc2626]"
      : "bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]";

  const headline = (() => {
    if (isError && error) return error;
    if (isDone) return "Your debrief is ready ✓";
    const cfg = stepConfig(currentStep);
    return cfg?.description ?? "";
  })();

  const subline = (() => {
    if (isError || isDone) return null;
    if (currentStep === "transcribing") {
      return (
        TIME_ESTIMATES.transcribing ??
        "This usually takes 20–40 seconds for a 30-minute meeting."
      );
    }
    const t = TIME_ESTIMATES[currentStep];
    return t ?? null;
  })();

  return (
    <div className="w-full max-w-2xl transition-opacity duration-500" role="status" aria-live="polite">
      <div className="flex w-full items-center">
        {steps.map((stepKey, i) => {
          const failedHere = isError && failedStep === stepKey;
          const completedHere =
            isDone ||
            (!isError && progressIndex > i) ||
            (isError && failIdx >= 0 && i < failIdx);
          const activeHere = !isError && !isDone && progressIndex === i;
          const segComplete =
            isDone ||
            (!isError && progressIndex > i - 1) ||
            (isError && failIdx > i - 1);

          return (
            <Fragment key={stepKey}>
              {i > 0 ? (
                <div
                  className="h-0.5 min-w-[6px] flex-1 self-center rounded-full"
                  aria-hidden
                  style={{ marginBottom: "18px" }}
                >
                  <div
                    className={`h-full rounded-full transition-colors duration-300 ${
                      segComplete ? (isDone ? "bg-[#22c55e]" : "bg-[#3b82f6]") : "bg-[#2a2a2a]"
                    }`}
                  />
                </div>
              ) : null}
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 ${
                    failedHere
                      ? "border-2 border-[#dc2626] bg-[#450a0a]"
                      : isDone || completedHere
                        ? "border-2 border-[#22c55e] bg-[#22c55e]"
                        : activeHere
                          ? "debrief-pipeline-step-active border-2 border-[#3b82f6] bg-[#1e3a5f]"
                          : "border-2 border-[#2a2a2a] bg-[#141414]"
                  }`}
                >
                  {failedHere ? (
                    <X className="h-3.5 w-3.5 text-red-400" strokeWidth={2.5} aria-hidden />
                  ) : isDone || completedHere ? (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} aria-hidden />
                  ) : activeHere ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#93c5fd]" aria-hidden />
                  ) : null}
                </div>
                <span className="mt-1 hidden max-w-[3rem] truncate text-center text-[10px] leading-tight text-zinc-500 md:block">
                  {SHORT_LABEL[stepKey] ?? stepKey}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#1f1f1f]">
        <div
          className={`h-full rounded-full transition-[width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${barColorClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="mt-3 space-y-1 text-center sm:text-left">
        <p
          className={`text-sm leading-snug ${
            isError ? "text-red-400" : isDone ? "text-[#22c55e]" : "text-zinc-100"
          }`}
        >
          {headline}
        </p>
        {subline ? <p className="text-xs leading-relaxed text-zinc-500">{subline}</p> : null}
      </div>

      {isError && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-[#1a1a1a] sm:w-auto"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
