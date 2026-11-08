import type { Metadata } from "next";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { formatDay, ordinal } from "@/lib/donation";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };
export const dynamic = "force-dynamic";

async function loadSession(id: string | undefined): Promise<Stripe.Checkout.Session | null> {
  if (!id || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    return await stripe().checkout.sessions.retrieve(id);
  } catch {
    return null;
  }
}

function dayFromISO(iso: string | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? { y, m: m - 1, d } : null;
}

export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const session = await loadSession(session_id);
  const md = session?.metadata ?? {};
  const amount = md.amount_gbp ? `£${md.amount_gbp}` : null;
  const type = md.donation_type;
  const first = dayFromISO(md.first_collection);
  const portal = process.env.STRIPE_PORTAL_LOGIN_URL;

  let title = "Thank you.";
  let body = "Your donation means a great deal to everyone at the centre.";
  if (type === "one_off") {
    body = `Your gift${amount ? ` of ${amount}` : ""} has been received. A receipt is on its way to your inbox.`;
  } else if (type === "monthly_dd") {
    title = "Your Direct Debit is set up.";
    body = `You’ll get an email from Stripe confirming your Direct Debit, and a reminder before each payment.`;
  } else if (type === "monthly_card") {
    title = "Your monthly gift is set up.";
    body = "You’ll get an email confirming your monthly gift.";
  }

  return (
    <main className="thanks">
      <div className="wrap">
        <div className="thanks-card fade">
          <div className="tick" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0E0F0C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </div>
          <h1>{title}</h1>
          <p>{body}</p>

          {session && type?.startsWith("monthly") && (
            <ul className="facts">
              {amount && <li><span>Amount</span><span>{amount} a month</span></li>}
              <li><span>Paid by</span><span>{type === "monthly_dd" ? "Direct Debit" : "Card"}</span></li>
              {md.collection_day && <li><span>Leaves your account</span><span>The {ordinal(Number(md.collection_day))} of each month</span></li>}
              {first && <li><span>First payment</span><span>{formatDay(first)}</span></li>}
              <li><span>Duration</span><span>{md.months ? `${md.months} months` : "Until you cancel"}</span></li>
              <li><span>Gift Aid</span><span>{md.gift_aid === "yes" ? "Yes, thank you" : "No"}</span></li>
            </ul>
          )}

          <div className="actions" style={{ marginTop: 32 }}>
            {type?.startsWith("monthly") && portal && (
              <a className="btn btn-dark" href={portal} rel="noopener noreferrer">
                Manage your donation <span className="ba" aria-hidden="true">→</span>
              </a>
            )}
            <a className="btn btn-ghost" href="/">Back to the homepage</a>
          </div>
        </div>
      </div>
    </main>
  );
}
