import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateEmailHTML } from "@/lib/emailTemplate";
import { emailRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { ensureDebriefResultShape, type DebriefResult } from "@/lib/types";

type SendDebriefPayload = {
  recipients: string[];
  result: DebriefResult;
  notes: string;
  shareUrl?: string;
  meetingTitle: string;
};

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, emailRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Server is not configured with RESEND_API_KEY." },
      { status: 500 }
    );
  }
  const resend = new Resend(key);

  const { recipients, result, notes, shareUrl, meetingTitle } =
    (await req.json()) as SendDebriefPayload;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
  }

  if (recipients.length > 20) {
    return NextResponse.json({ error: "Maximum 20 recipients" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = recipients.filter((e) => !emailRegex.test(e.trim()));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid email addresses: ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  console.log("[send-debrief] result.actionItems (raw):", result.actionItems);

  const normalized = ensureDebriefResultShape(result as DebriefResult);
  console.log("[send-debrief] normalized.actionItems:", normalized.actionItems);

  const html = generateEmailHTML(normalized, notes ?? "", shareUrl);

  try {
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() || "Debrief <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from,
      to: recipients.map((e) => e.trim()),
      subject: `${meetingTitle} — Meeting Debrief`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

