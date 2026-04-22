import type { DebriefResult, MeetingType } from "./types";
import { getSiteUrl } from "./site";

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  standup: "Standup",
  sales_call: "Sales Call",
  brainstorm: "Brainstorm",
  one_on_one: "1:1",
  board_review: "Board Review",
  general_sync: "General Sync",
};

const MEETING_TYPE_COLORS: Record<MeetingType, string> = {
  standup: "#7c3aed",
  sales_call: "#16a34a",
  brainstorm: "#ea580c",
  one_on_one: "#0891b2",
  board_review: "#dc2626",
  general_sync: "#3b82f6",
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function generateEmailHTML(
  result: DebriefResult,
  notes: string,
  shareUrl?: string
): string {
  const accentColor = MEETING_TYPE_COLORS[result.meetingType];
  const typeLabel = MEETING_TYPE_LABELS[result.meetingType];

  const actionItems = Array.isArray(result.actionItems) ? result.actionItems : [];
  const hasActionItems = actionItems.length > 0;

  const actionItemsHTML = actionItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">${escapeHtml(item.task)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">${escapeHtml(item.owner || "—")}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">${escapeHtml(item.due || "—")}</td>
    </tr>
  `
    )
    .join("");

  const siteUrl = getSiteUrl();
  const typeSpecificHTML = buildTypeSpecificHTML(result);

  const notesHTML = notes
    ? `
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9ca3af; text-transform: uppercase; margin: 0 0 12px 0;">Notes</h2>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(notes)}</div>
    </div>
  `
    : "";

  const shareLinkHTML = shareUrl
    ? `
    <div style="text-align: center; margin: 32px 0; padding: 20px; background: #eff6ff; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">View the full interactive debrief</p>
      <a href="${escapeHtml(
        shareUrl
      )}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">Open Debrief →</a>
    </div>
  `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(result.meetingTitle)} — Debrief</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    
    <div style="background: #111827; border-radius: 12px 12px 0 0; padding: 28px 32px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="background: ${accentColor}22; color: ${accentColor}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px;">${typeLabel}</span>
      </div>
      <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: white;">${escapeHtml(result.meetingTitle)}</h1>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">${escapeHtml(
        result.date
      )} · ${escapeHtml(result.attendees.join(", "))}</p>
    </div>

    <div style="background: white; border-radius: 0 0 12px 12px; padding: 32px;">
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9ca3af; text-transform: uppercase; margin: 0 0 12px 0;">Summary</h2>
        <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.7;">${escapeHtml(
          result.summary
        )}</p>
      </div>

      ${typeSpecificHTML}

      ${
        hasActionItems
          ? `
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9ca3af; text-transform: uppercase; margin: 0 0 12px 0;">Action Items</h2>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Task</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Owner</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Due</th>
            </tr>
          </thead>
          <tbody>${actionItemsHTML}</tbody>
        </table>
      </div>
      `
          : ""
      }

      ${notesHTML}
      ${shareLinkHTML}

      ${
        "followUpEmail" in result && result.followUpEmail
          ? `
      <div style="margin-bottom: 32px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 3px solid ${accentColor};">
        <h2 style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9ca3af; text-transform: uppercase; margin: 0 0 12px 0;">Suggested Follow-up</h2>
        <p style="margin: 0; font-size: 13px; color: #374151; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(
          result.followUpEmail.body
        )}</p>
      </div>
      `
          : ""
      }
    </div>

    <div style="text-align: center; padding: 24px 0 0 0;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        Sent via <a href="${escapeHtml(
          siteUrl
        )}" style="color: #3b82f6; text-decoration: none;">Debrief</a> · 
        <a href="${escapeHtml(siteUrl)}" style="color: #9ca3af; text-decoration: none;">Generate your own</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function buildTypeSpecificHTML(result: DebriefResult): string {
  switch (result.meetingType) {
    case "standup":
      return `
        ${result.shipped.length > 0 ? buildListSection("Shipped", result.shipped, "#16a34a") : ""}
        ${
          result.blockers.length > 0
            ? buildListSection(
                "Blockers",
                result.blockers.map((b) => (b.owner ? `${b.blocker} (${b.owner})` : b.blocker)),
                "#dc2626"
              )
            : ""
        }
        ${result.upNext.length > 0 ? buildListSection("Up Next", result.upNext, "#6b7280") : ""}
      `;
    case "sales_call":
      return `
        <div style="margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9ca3af; text-transform: uppercase;">Deal Signal: </span>
          <span style="font-size: 14px; font-weight: 600; color: #111827; text-transform: capitalize;">${escapeHtml(
            result.dealSignal
          )}</span>
        </div>
        ${result.painPoints.length > 0 ? buildListSection("Pain Points", result.painPoints, "#dc2626") : ""}
        ${result.nextSteps.length > 0 ? buildListSection("Next Steps", result.nextSteps, "#3b82f6") : ""}
      `;
    case "brainstorm":
      return `
        ${
          result.ideasShortlisted.length > 0
            ? buildListSection("Shortlisted Ideas", result.ideasShortlisted, "#16a34a")
            : ""
        }
        ${result.openThreads.length > 0 ? buildListSection("Open Threads", result.openThreads, "#ea580c") : ""}
      `;
    case "one_on_one":
      return `
        ${
          result.feedbackThemes.length > 0
            ? buildListSection("Feedback Themes", result.feedbackThemes, "#0891b2")
            : ""
        }
        ${
          result.commitmentsMade.length > 0
            ? buildListSection(
                "Commitments",
                result.commitmentsMade.map((c) => `${c.commitment} (${c.owner})`),
                "#7c3aed"
              )
            : ""
        }
      `;
    case "board_review":
      return `
        ${result.risksRaised.length > 0 ? buildListSection("Risks Raised", result.risksRaised, "#ea580c") : ""}
        ${result.concerns.length > 0 ? buildListSection("Concerns", result.concerns, "#dc2626") : ""}
      `;
    case "general_sync":
      return `
        ${
          result.decisions.length > 0
            ? buildListSection(
                "Decisions Made",
                result.decisions.map((d) => d.decision),
                "#3b82f6"
              )
            : ""
        }
        ${
          result.openQuestions.length > 0
            ? buildListSection("Open Questions", result.openQuestions, "#ca8a04")
            : ""
        }
      `;
    default:
      return "";
  }
}

function buildListSection(title: string, items: string[], accentColor: string): string {
  return `
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9ca3af; text-transform: uppercase; margin: 0 0 12px 0;">${escapeHtml(
        title
      )}</h2>
      ${items
        .map(
          (item) => `
        <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
          <div style="width: 3px; min-height: 20px; background: ${accentColor}; border-radius: 2px; margin-top: 2px; flex-shrink: 0;"></div>
          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${escapeHtml(item)}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

