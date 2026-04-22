const MAX_SIZE_MB = 25;

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "video/mp4",
] as const;

const EXT_OK = new Set(["mp3", "mp4", "m4a", "wav", "webm"]);

/** Client-side validation before upload. Returns null if OK. */
export function validateAudioFile(file: File): string | null {
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Audio file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeOk = ALLOWED_AUDIO_TYPES.includes(
    file.type as (typeof ALLOWED_AUDIO_TYPES)[number]
  );
  const extOk = EXT_OK.has(ext);
  if (mimeOk || extOk) return null;
  return "Unsupported file type. Please upload an MP3, MP4, M4A, or WAV file.";
}
