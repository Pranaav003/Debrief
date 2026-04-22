import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { getOrCreateCustomer, getStripe } from "@/lib/stripe";

function appUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!u) return "http://localhost:3000";
  return u.replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, generalRatelimit);
  if (rateLimitRes) return rateLimitRes;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing is not configured (STRIPE_SECRET_KEY)." },
      { status: 503 }
    );
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "Billing is not configured (STRIPE_PRO_PRICE_ID)." },
      { status: 503 }
    );
  }

  let body: { ownerToken?: unknown; email?: unknown };
  try {
    body = (await req.json()) as { ownerToken?: unknown; email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ownerToken = typeof body.ownerToken === "string" ? body.ownerToken.trim() : "";
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing ownerToken" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim()
      : undefined;

  try {
    const customerId = await getOrCreateCustomer(ownerToken, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl()}/?upgraded=true`,
      cancel_url: `${appUrl()}/?upgrade_cancelled=true`,
      metadata: { owner_token: ownerToken },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session missing URL." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
