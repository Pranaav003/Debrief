/**
 * Sample Zoom-style transcript for testing DeBrief end-to-end.
 * Use “Load example” on the home page or paste this into the textarea.
 */
export const EXAMPLE_TRANSCRIPT = `
00:01:02 Alex Chen: Hey everyone, thanks for joining. Quick roadmap sync for the mobile app.

00:01:18 Jordan Lee: Sounds good. I looked at the crash reports from last week — still seeing spikes on Android 13.

00:01:35 Sam Rivera: I can own that. I'll profile the image pipeline and ship a patch candidate by Thursday EOD.

00:01:52 Alex Chen: Perfect. Decision from leadership: we're cutting the offline mode scope for v1. We'll ship online-only first, then iterate.

00:02:10 Jordan Lee: Okay. That means we need to update the App Store copy and remove the offline toggle from settings.

00:02:28 Alex Chen: Jordan, can you take the store listings and help text? Due Monday.

00:02:35 Jordan Lee: Yes, I'll have drafts in the shared doc by Monday noon.

00:02:48 Sam Rivera: Open question — do we still want push notifications in v1 if we're online-only? The backend work isn't started.

00:03:05 Alex Chen: Let's park that. We'll decide in the next sprint planning once we see how Thursday's patch lands.

00:03:22 Alex Chen: Action item for me: I'll email design about removing offline illustrations from the onboarding flow by Wednesday.

00:03:38 Jordan Lee: One more thing — legal asked whether we log IP addresses on login. I wasn't sure what to tell them.

00:03:51 Alex Chen: Good catch. I'll loop in Priya from security and get a one-pager — no promises on timeline yet.

00:04:05 Sam Rivera: Cool. Recap: Android fix Thursday, Jordan on copy Monday, Alex on design email Wednesday, and we defer push + legal until we have answers.

00:04:18 Alex Chen: Exactly. Thanks all — same time next week unless we need a fire drill on the patch.
`.trim();
