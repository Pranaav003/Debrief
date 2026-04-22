import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

let stripeClient: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripeClient !== undefined) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    stripeClient = null;
    return stripeClient;
  }
  stripeClient = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return stripeClient;
}

export async function getOrCreateCustomer(
  ownerToken: string,
  email?: string
): Promise<string> {
  const { data: existing } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("owner_token", ownerToken)
    .maybeSingle();

  const existingCustomerId =
    existing &&
    typeof existing === "object" &&
    "stripe_customer_id" in existing &&
    typeof (existing as { stripe_customer_id?: unknown }).stripe_customer_id === "string"
      ? (existing as { stripe_customer_id: string }).stripe_customer_id
      : "";

  if (existingCustomerId) return existingCustomerId;

  const stripe = getStripe();
  if (!stripe) throw new Error("Billing is not configured.");

  const customer = await stripe.customers.create({
    email,
    metadata: { owner_token: ownerToken },
  });

  await supabaseAdmin().from("subscriptions").upsert(
    {
      owner_token: ownerToken,
      stripe_customer_id: customer.id,
      plan: "free",
      status: "pending",
    },
    { onConflict: "owner_token" }
  );

  return customer.id;
}
