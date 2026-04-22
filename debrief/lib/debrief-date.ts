/** Human-readable date for DeBrief JSON and UI (e.g. "March 24, 2026"). */
export function formatTodayMeetingDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

/** Appends calendar context so the model uses a real “today” when the transcript has no meeting date. */
export function buildDebriefSystemPrompt(basePrompt: string): string {
  const today = formatTodayMeetingDate();
  return `${basePrompt.trim()}

---
Calendar: Today is ${today} (the date this debrief is being generated).

Rules for the JSON "date" field:
- If the Zoom/meeting transcript clearly states when the meeting happened (e.g. "March 3", "3/5/2025", "last Tuesday"), use that meeting date in clear prose.
- If no meeting date appears in the transcript, set "date" to exactly: ${today}
- Never return an empty string, "unknown", "N/A", or a placeholder for "date".`;
}
