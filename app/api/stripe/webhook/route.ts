import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe calls this after a donor finishes checkout.
 * - Fixed-length monthly gifts: sets the date the subscription ends.
 * - Gift Aid: copies the declaration onto the donor's Stripe customer record,
 *   so your treasurer can export it for the HMRC claim.
 * Safe to run more than once for the same event.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err: any) {
    console.error("Webhook signature check failed:", err?.message);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const md = session.metadata ?? {};

      if (session.mode === "subscription" && session.subscription && md.cancel_at) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await stripe().subscriptions.update(subscriptionId, {
          cancel_at: Number(md.cancel_at),
          proration_behavior: "none",
        });
      }

      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (customerId && md.gift_aid === "yes") {
        await stripe().customers.update(customerId, {
          metadata: {
            gift_aid: "yes",
            gift_aid_name: md.gift_aid_name ?? "",
            gift_aid_address: md.gift_aid_address ?? "",
            gift_aid_postcode: md.gift_aid_postcode ?? "",
            gift_aid_declared_at: md.gift_aid_declared_at ?? "",
            gift_aid_declaration: md.gift_aid_declaration ?? "",
          },
        });
      }
    }
  } catch (err: any) {
    // A 500 makes Stripe retry the event later.
    console.error(`Webhook ${event.type} failed:`, err?.message ?? err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
