import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, siteUrl } from "@/lib/stripe";
import { getContent } from "@/lib/storage";
import { DONATION_RULES } from "@/config/site";
import { londonTimestamp, monthlySchedule, ordinal, toISODay, type Method } from "@/lib/donation";

export const runtime = "nodejs";

type Body = {
  freq?: unknown;
  amount?: unknown;
  method?: unknown;
  day?: unknown;
  months?: unknown;
  email?: unknown;
  giftAid?: { name?: unknown; address?: unknown; postcode?: unknown } | null;
};

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "";

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }

  // ── Validate everything again on the server ──
  const freq = body.freq === "once" ? "once" : body.freq === "monthly" ? "monthly" : null;
  if (!freq) return bad("Choose monthly or one-off.");

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < DONATION_RULES.minAmount || amount > DONATION_RULES.maxAmount)
    return bad(`Please enter an amount between £${DONATION_RULES.minAmount} and £${DONATION_RULES.maxAmount}.`);
  const pence = Math.round(amount * 100);

  const method: Method = freq === "monthly" && body.method === "dd" ? "dd" : "card";

  const day = Number(body.day);
  if (freq === "monthly" && (!Number.isInteger(day) || day < 1 || day > 28))
    return bad("Choose a collection day between the 1st and the 28th.");

  let months: number | null = null;
  if (freq === "monthly" && body.months !== null && body.months !== undefined) {
    months = Number(body.months);
    if (!Number.isInteger(months) || months < DONATION_RULES.minMonths || months > DONATION_RULES.maxMonths)
      return bad(`Choose between ${DONATION_RULES.minMonths} and ${DONATION_RULES.maxMonths} months.`);
  }

  const email = clean(body.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad("Please enter a valid email address.");

  const content = await getContent();
  let giftAid: { name: string; address: string; postcode: string } | null = null;
  if (body.giftAid && content.donations.giftAidEnabled) {
    giftAid = {
      name: clean(body.giftAid.name, 120),
      address: clean(body.giftAid.address, 200),
      postcode: clean(body.giftAid.postcode, 10).toUpperCase(),
    };
    if (!giftAid.name || !giftAid.address || !giftAid.postcode)
      return bad("Add your full name, home address and postcode for Gift Aid.");
  }

  // Stripe metadata values are limited to 500 characters each.
  const metadata: Record<string, string> = {
    source: "website",
    donation_type: freq === "monthly" ? `monthly_${method}` : "one_off",
    amount_gbp: (pence / 100).toFixed(2),
    gift_aid: giftAid ? "yes" : "no",
  };
  if (giftAid) {
    metadata.gift_aid_name = giftAid.name;
    metadata.gift_aid_address = giftAid.address;
    metadata.gift_aid_postcode = giftAid.postcode;
    metadata.gift_aid_declared_at = new Date().toISOString();
    metadata.gift_aid_declaration =
      "UK taxpayer; understands they must pay any difference if they pay less Income Tax and/or Capital Gains Tax than the Gift Aid claimed.";
  }

  const base = siteUrl(req);
  // ui_mode "elements": the payment fields are shown inside our own donation
  // card (Stripe's Payment Element) instead of on a separate Stripe page.
  const common = {
    ui_mode: "elements" as const,
    return_url: `${base}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: email,
    locale: "en-GB" as const,
    metadata,
  };
  const productName = `Donation to ${content.centreName}`;

  try {
    let session: Stripe.Checkout.Session;

    if (freq === "once") {
      session = await stripe().checkout.sessions.create({
        ...common,
        mode: "payment",
        allowed_payment_method_types: ["card"], // Apple Pay and Google Pay appear automatically with card.
        customer_creation: "always",
        line_items: [
          {
            quantity: 1,
            price_data: { currency: "gbp", unit_amount: pence, product_data: { name: productName } },
          },
        ],
        payment_intent_data: { description: productName, metadata },
      });
    } else {
      const schedule = monthlySchedule(day, method, months);
      const anchor = londonTimestamp(schedule.firstRequest, 9);
      metadata.collection_day = String(day);
      metadata.first_collection = toISODay(schedule.firstLeave);
      metadata.billing_anchor = String(anchor);
      if (months && schedule.endRequest) {
        metadata.months = String(months);
        metadata.cancel_at = String(londonTimestamp(schedule.endRequest, 6));
      }

      const params: Stripe.Checkout.SessionCreateParams = {
        ...common,
        mode: "subscription",
        allowed_payment_method_types: [method === "dd" ? "bacs_debit" : "card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: pence,
              recurring: { interval: "month" },
              product_data: { name: `Monthly ${productName.charAt(0).toLowerCase()}${productName.slice(1)}` },
            },
          },
        ],
        subscription_data: {
          description: `Monthly donation, leaving your account on the ${ordinal(day)} of each month`,
          billing_cycle_anchor: anchor,
          proration_behavior: "none",
          metadata,
        },
      };

      try {
        session = await stripe().checkout.sessions.create(params);
      } catch (err: any) {
        // If Stripe won't accept an anchor that far ahead, start the subscription
        // on the same date with a "trial" instead. No money is taken until then.
        if (err?.type !== "StripeInvalidRequestError" || !/billing_cycle_anchor/i.test(err?.message ?? "")) throw err;
        const { billing_cycle_anchor, proration_behavior, ...rest } = params.subscription_data!;
        session = await stripe().checkout.sessions.create({
          ...params,
          subscription_data: { ...rest, trial_end: anchor },
        });
      }
    }

    if (!session.client_secret) throw new Error("Stripe returned no client secret");
    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    console.error("Checkout error:", err?.message ?? err);
    return NextResponse.json(
      { error: "We couldn't load the secure payment form just now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
