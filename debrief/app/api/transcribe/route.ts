import { createReadStream } from "fs";
import { unlink, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { aiRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";

export const maxDuration = 300;

const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeBasename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 0 ? base : "audio";
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, aiRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  let tmpPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("audio");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing audio file. Use form field name \"audio\"." },
        { status: 400 }
      );
    }

    const uploadName =
      file instanceof File ? file.name : "upload.bin";

    if (file.size > WHISPER_MAX_BYTES) {
      return NextResponse.json(
        {
          error:
            "File is too large. Whisper accepts files up to 25 MB. Try a shorter clip or compress the audio.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tmpPath = join(
      tmpdir(),
      `debrief-upload-${Date.now()}-${safeBasename(uploadName)}`
    );
    await writeFile(tmpPath, buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tmpPath),
      model: "whisper-1",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Transcription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tmpPath) {
      await unlink(tmpPath).catch(() => undefined);
    }
  }
}
