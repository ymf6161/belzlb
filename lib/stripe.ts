import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key, { appInfo: { name: "community-centre-site" } });
  return client;
}

export function siteUrl(req?: Request): string {
  const configured = process.env.SITE_URL?.trim();
  // Ignore a leftover local address (e.g. the example http://localhost:3000)
  // on the live site, so links in emails and from Stripe still work.
  const isLocal = configured ? /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configured) : false;
  if (configured && !(isLocal && process.env.NODE_ENV === "production")) return configured.replace(/\/$/, "");
  // Railway sets this to the service's public address (e.g. xyz.up.railway.app).
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  if (req) {
    // Behind a proxy, use the address the visitor actually used.
    const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim();
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "https";
    if (host) return `${proto}://${host}`;
    return new URL(req.url).origin;
  }
  return "http://localhost:3000";
}
