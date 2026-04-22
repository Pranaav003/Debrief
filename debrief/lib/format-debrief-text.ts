import type { DebriefResult, Decision } from "@/lib/types";

function formatDecisions(label: string, decisions: Decision[]): string {
  return decisions.length === 0
    ? `${label}\n(none noted)`
    : `${label}\n${decisions
        .map(
          (x, i) =>
            `${i + 1}. ${x.decision}${x.owner ? ` — Owner: ${x.owner}` : ""}`
        )
        .join("\n")}`;
}

export function formatFullDeBriefText(d: DebriefResult): string {
  const blocks: string[] = [
    [
      d.meetingTitle,
      d.date ? `Date: ${d.date}` : "",
      d.meetingType ? `Type: ${d.meetingType}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    `SUMMARY\n${d.summary || "(none)"}`,
  ];

  if (d.attendees.length) {
    blocks.push(`ATTENDEES\n${d.attendees.join(", ")}`);
  }

  if (d.meetingType === "general_sync") {
    blocks.push(formatDecisions("DECISIONS", d.decisions));
    const questionsBlock =
      d.openQuestions.length === 0
        ? "OPEN QUESTIONS\n(none noted)"
        : `OPEN QUESTIONS\n${d.openQuestions
            .map((q, i) => `${i + 1}. ${q}`)
            .join("\n")}`;
    blocks.push(questionsBlock);
  } else if (d.meetingType === "board_review") {
    const metricsBlock =
      d.metricsDiscussed.length === 0
        ? "METRICS\n(none noted)"
        : `METRICS\n${d.metricsDiscussed
            .map((m, i) => `${i + 1}. ${m.metric}: ${m.status}`)
            .join("\n")}`;
    blocks.push(metricsBlock);
    blocks.push(formatDecisions("STRATEGIC DECISIONS", d.strategicDecisions));
    if (d.risksRaised.length) blocks.push(`RISKS\n${d.risksRaised.join("\n")}`);
    if (d.concerns.length) blocks.push(`CONCERNS\n${d.concerns.join("\n")}`);
  } else if (d.meetingType === "standup") {
    if (d.shipped.length) blocks.push(`SHIPPED\n${d.shipped.join("\n")}`);
    if (d.inProgress.length) blocks.push(`IN PROGRESS\n${d.inProgress.join("\n")}`);
    const blockersBlock =
      d.blockers.length === 0
        ? "BLOCKERS\n(none noted)"
        : `BLOCKERS\n${d.blockers
            .map(
              (b, i) =>
                `${i + 1}. ${b.blocker}${b.owner ? ` — Owner: ${b.owner}` : ""}`
            )
            .join("\n")}`;
    blocks.push(blockersBlock);
    if (d.upNext.length) blocks.push(`UP NEXT\n${d.upNext.join("\n")}`);
  } else if (d.meetingType === "sales_call") {
    if (d.prospect) blocks.push(`PROSPECT\n${d.prospect}`);
    if (d.painPoints.length) blocks.push(`PAIN POINTS\n${d.painPoints.join("\n")}`);
    const objectionsBlock =
      d.objections.length === 0
        ? "OBJECTIONS\n(none noted)"
        : `OBJECTIONS\n${d.objections
            .map(
              (o, i) =>
                `${i + 1}. ${o.objection}${o.response ? ` — Response: ${o.response}` : ""}`
            )
            .join("\n")}`;
    blocks.push(objectionsBlock);
    if (d.nextSteps.length) blocks.push(`NEXT STEPS\n${d.nextSteps.join("\n")}`);
    blocks.push(`DEAL SIGNAL\n${d.dealSignal}`);
  } else if (d.meetingType === "brainstorm") {
    if (d.topic) blocks.push(`TOPIC\n${d.topic}`);
    if (d.ideasGenerated.length)
      blocks.push(`IDEAS GENERATED\n${d.ideasGenerated.join("\n")}`);
    if (d.ideasShortlisted.length)
      blocks.push(`IDEAS SHORTLISTED\n${d.ideasShortlisted.join("\n")}`);
    const killedBlock =
      d.ideasKilled.length === 0
        ? "IDEAS KILLED\n(none noted)"
        : `IDEAS KILLED\n${d.ideasKilled
            .map(
              (k, i) =>
                `${i + 1}. ${k.idea}${k.reason ? ` — Reason: ${k.reason}` : ""}`
            )
            .join("\n")}`;
    blocks.push(killedBlock);
    if (d.openThreads.length)
      blocks.push(`OPEN THREADS\n${d.openThreads.join("\n")}`);
  } else if (d.meetingType === "one_on_one") {
    if (d.participants.length)
      blocks.push(`PARTICIPANTS\n${d.participants.join(", ")}`);
    if (d.feedbackThemes.length)
      blocks.push(`FEEDBACK THEMES\n${d.feedbackThemes.join("\n")}`);
    if (d.goalsDiscussed.length)
      blocks.push(`GOALS DISCUSSED\n${d.goalsDiscussed.join("\n")}`);
    const commitsBlock =
      d.commitmentsMade.length === 0
        ? "COMMITMENTS\n(none noted)"
        : `COMMITMENTS\n${d.commitmentsMade
            .map((c, i) => `${i + 1}. ${c.commitment} — Owner: ${c.owner}`)
            .join("\n")}`;
    blocks.push(commitsBlock);
    blocks.push(`MOOD\n${d.mood}`);
  }

  const actionsBlock =
    d.actionItems.length === 0
      ? "ACTION ITEMS\n(none noted)"
      : `ACTION ITEMS\n${d.actionItems
          .map((x, i) => {
            const owner = x.owner ? ` | Owner: ${x.owner}` : "";
            const due = x.due ? ` | Due: ${x.due}` : "";
            const done = x.completed ? " [done]" : "";
            return `${i + 1}. ${x.task}${owner}${due}${done}`;
          })
          .join("\n")}`;
  blocks.push(actionsBlock);

  blocks.push(
    `FOLLOW-UP EMAIL\nSubject: ${d.followUpEmail.subject}\n\n${d.followUpEmail.body}`
  );

  return blocks.join("\n\n").trim();
}
