const ADJECTIVES = [
  "swift",
  "clear",
  "sharp",
  "brief",
  "solid",
  "calm",
  "bold",
  "clean",
];
const NOUNS = [
  "sync",
  "call",
  "meet",
  "huddle",
  "review",
  "standup",
  "session",
  "debrief",
];

export function generateSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
}

