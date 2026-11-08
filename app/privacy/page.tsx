import type { Metadata } from "next";
import { getContent } from "@/lib/storage";

export const metadata: Metadata = { title: "Privacy" };
export const dynamic = "force-dynamic";

export default async function Privacy() {
  const c = await getContent();
  return (
    <main className="section">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <p className="eyebrow"><a href="/">← {c.centreName}</a></p>
        <h1 className="h2" style={{ marginBottom: 40 }}>Privacy</h1>
        <div style={{ color: "var(--ink-2)" }}>
          <p><strong>[Review this page with your trustees before launch. It is a starting point, not legal advice.]</strong></p>
          <p>
            {c.centreName}{c.charityNumber && ` (registered charity no. ${c.charityNumber})`} is responsible for the
            personal information collected through this website.
          </p>
          <h2 style={{ fontWeight: 500, fontSize: 22 }}>Donations</h2>
          <p>
            Payments are processed by Stripe. Card and bank details are entered on Stripe’s secure pages and are never
            seen or stored by us. Stripe shares your name, email, the amount and the date with us so we can thank you,
            manage your gift and keep financial records.
          </p>
          <h2 style={{ fontWeight: 500, fontSize: 22 }}>Gift Aid</h2>
          <p>
            If you make a Gift Aid declaration, we keep your name, home address, postcode and the date of your
            declaration, as HMRC requires, and share them with HMRC when we claim.
          </p>
          <h2 style={{ fontWeight: 500, fontSize: 22 }}>Your rights</h2>
          <p>
            You can ask to see, correct or delete your information, or cancel a regular gift, at any time by
            contacting us{c.visit.email && <> at <a href={`mailto:${c.visit.email}`}>{c.visit.email}</a></>}.
          </p>
          <p>This site doesn’t use advertising or tracking cookies.</p>
        </div>
      </div>
    </main>
  );
}
