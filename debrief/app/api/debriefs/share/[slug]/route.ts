import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { loadShareBySlug } from "@/lib/loadShareBySlug";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const rateLimitResponse = await checkRateLimit(req, generalRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const payload = await loadShareBySlug(params.slug);
  if (!payload) {
    return NextResponse.json(
      { error: "Share link not found or has been revoked" },
      { status: 404 }
    );
  }

  return NextResponse.json(payload);
}
