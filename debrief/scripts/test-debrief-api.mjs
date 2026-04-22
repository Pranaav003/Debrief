/**
 * End-to-end API checks for DeBrief (run the dev server first).
 *
 * Usage:
 *   npm run dev   # in another terminal
 *   node scripts/test-debrief-api.mjs
 *   node scripts/test-debrief-api.mjs /path/to/audio.mp3
 *
 * Optional env:
 *   BASE_URL=http://localhost:3000
 */

import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { basename } from "path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

/** Required by POST /api/summarize for daily limits; stable per run unless DEBRIEF_TEST_OWNER_TOKEN is set. */
const TEST_OWNER =
  process.env.DEBRIEF_TEST_OWNER_TOKEN?.trim() || `test-pipeline-${randomUUID()}`;

const SAMPLE_TRANSCRIPT = `
Alex: Quick sync on the launch. We agreed the beta goes live next Tuesday.
Jordan: I'll handle the API cutover and smoke tests Monday night.
Alex: Decision: we're skipping the Redis cache for v1 to ship faster.
Sam: Open question — do we need SOC2 docs before we onboard Acme?
Alex: Action item for Sam: draft a one-pager on timeline by Friday.
Jordan: I'll post the runbook in Slack today.
`.trim();

async function testSummarize() {
  console.log("\n--- POST /api/summarize (sample transcript) ---\n");
  const res = await fetch(`${BASE}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: SAMPLE_TRANSCRIPT, ownerToken: TEST_OWNER }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text.slice(0, 500));
    throw new Error(`summarize failed: HTTP ${res.status}`);
  }
  if (!res.ok) {
    console.error(data);
    throw new Error(`summarize failed: HTTP ${res.status}`);
  }
  const keys = [
    "meetingTitle",
    "date",
    "attendees",
    "summary",
    "decisions",
    "actionItems",
    "openQuestions",
    "followUpEmail",
  ];
  const missing = keys.filter((k) => !(k in data));
  if (missing.length) {
    console.warn("Unexpected shape; missing keys:", missing.join(", "));
  }
  console.log("HTTP", res.status);
  console.log("meetingTitle:", data.meetingTitle);
  console.log("summary (preview):", String(data.summary).slice(0, 160) + "…");
  console.log(
    "actionItems count:",
    Array.isArray(data.actionItems) ? data.actionItems.length : 0
  );
  console.log("followUpEmail.subject:", data.followUpEmail?.subject);
  return data;
}

async function testTranscribe(audioPath) {
  console.log("\n--- POST /api/transcribe ---\n");
  console.log("File:", audioPath);
  const buf = readFileSync(audioPath);
  const name = basename(audioPath);
  const blob = new Blob([buf]);
  const form = new FormData();
  form.append("audio", blob, name);

  const res = await fetch(`${BASE}/api/transcribe`, {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text.slice(0, 500));
    throw new Error(`transcribe failed: HTTP ${res.status}`);
  }
  if (!res.ok) {
    console.error(data);
    throw new Error(`transcribe failed: HTTP ${res.status}`);
  }
  console.log("HTTP", res.status);
  console.log("transcript (preview):", String(data.transcript).slice(0, 200) + "…");
  return data.transcript;
}

async function testSummarizeFromTranscript(transcript) {
  console.log("\n--- POST /api/summarize (after transcribe) ---\n");
  const res = await fetch(`${BASE}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, ownerToken: TEST_OWNER }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(data);
    throw new Error(`summarize (round 2) failed: HTTP ${res.status}`);
  }
  console.log("HTTP", res.status);
  console.log("meetingTitle:", data.meetingTitle);
}

async function main() {
  console.log("Base URL:", BASE);
  console.log("Owner token (summarize):", TEST_OWNER);
  await testSummarize();

  const audioPath = process.argv[2];
  if (audioPath) {
    const transcript = await testTranscribe(audioPath);
    await testSummarizeFromTranscript(transcript);
  } else {
    console.log(
      "\n(Skipping transcribe: pass an audio file path to test Whisper + full pipeline.)\n"
    );
  }

  console.log("\nAll requested checks finished.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
