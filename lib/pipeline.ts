/**
 * Debrief generation pipeline steps.
 *
 * If Zoom (or similar) cloud import is re-added later, reuse `PipelineProgress`
 * with `AUDIO_PIPELINE_STEPS` / `isAudio: true` — that path also downloads
 * and transcribes audio like the upload flow.
 */

export type PipelineStep =
  | "idle"
  | "validating"
  | "uploading"
  | "transcribing"
  | "classifying"
  | "generating"
  | "saving"
  | "done"
  | "error";

export type PipelineStepConfig = {
  key: Exclude<PipelineStep, "idle" | "error">;
  label: string;
  description: string;
  estimatedSeconds: number;
};

export const PIPELINE_STEPS: PipelineStepConfig[] = [
  {
    key: "validating",
    label: "Validating",
    description: "Checking your input...",
    estimatedSeconds: 1,
  },
  {
    key: "uploading",
    label: "Uploading",
    description: "Uploading audio file...",
    estimatedSeconds: 5,
  },
  {
    key: "transcribing",
    label: "Transcribing",
    description: "Converting speech to text with Whisper...",
    estimatedSeconds: 30,
  },
  {
    key: "classifying",
    label: "Detecting",
    description: "Identifying meeting type...",
    estimatedSeconds: 3,
  },
  {
    key: "generating",
    label: "Generating",
    description: "Building your debrief with GPT-4o...",
    estimatedSeconds: 15,
  },
  {
    key: "saving",
    label: "Saving",
    description: "Saving to your account...",
    estimatedSeconds: 2,
  },
  {
    key: "done",
    label: "Done",
    description: "Your debrief is ready.",
    estimatedSeconds: 0,
  },
];

/** Steps for pasted text (no upload / server transcribe). */
export const TEXT_PIPELINE_STEPS: PipelineStep[] = [
  "validating",
  "classifying",
  "generating",
  "saving",
  "done",
];

/** Steps for audio upload (includes upload + Whisper on server). */
export const AUDIO_PIPELINE_STEPS: PipelineStep[] = [
  "validating",
  "uploading",
  "transcribing",
  "classifying",
  "generating",
  "saving",
  "done",
];

export function getStepIndex(step: PipelineStep, isAudio: boolean): number {
  const steps = isAudio ? AUDIO_PIPELINE_STEPS : TEXT_PIPELINE_STEPS;
  return steps.indexOf(step);
}

export function getStepProgress(step: PipelineStep, isAudio: boolean): number {
  const steps = isAudio ? AUDIO_PIPELINE_STEPS : TEXT_PIPELINE_STEPS;
  const index = steps.indexOf(step);
  if (index === -1) return 0;
  if (steps.length <= 1) return 100;
  return Math.round((index / (steps.length - 1)) * 100);
}

export const TIME_ESTIMATES: Partial<Record<PipelineStep, string>> = {
  uploading: "Depends on file size…",
  transcribing: "Usually 20–60 seconds · longer for long recordings",
  classifying: "Just a moment…",
  generating: "Usually 10–20 seconds",
  saving: "Almost there…",
};
