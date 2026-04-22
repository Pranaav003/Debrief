import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function subscriptionId(sub: string | Stripe.Subscription | null | undefined): string | null {
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function customerId(cust: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null {
  if (!cust) return null;
  return typeof cust === "string" ? cust : cust.id;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const ownerToken = session.metadata?.owner_token;
        if (!ownerToken) break;

        const cust = customerId(session.customer);
        const subId = subscriptionId(session.subscription);
        if (!cust || !subId) break;

        await supabaseAdmin().from("subscriptions").upsert(
          {
            owner_token: ownerToken,
            stripe_customer_id: cust,
            stripe_subscription_id: subId,
            plan: "pro",
            status: "active",
          },
          { onConflict: "owner_token" }
        );
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subAny = sub as unknown as { current_period_end?: number };
        const subId = sub.id;
        const periodEnd =
          typeof subAny.current_period_end === "number"
            ? subAny.current_period_end
            : null;

        const { data: existing } = await supabaseAdmin()
          .from("subscriptions")
          .select("owner_token")
          .eq("stripe_subscription_id", subId)
          .maybeSingle();

        if (!existing) break;

        const isPro =
          sub.status === "active" ||
          sub.status === "trialing";

        await supabaseAdmin()
          .from("subscriptions")
          .update({
            status: sub.status,
            plan: isPro ? "pro" : "free",
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", subId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin()
          .from("subscriptions")
          .update({ plan: "free", status: "canceled" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
