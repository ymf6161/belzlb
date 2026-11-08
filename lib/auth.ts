import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Magic-link login for the admin panel, with no database:
 * - A login link carries a signed token that expires after 15 minutes.
 * - Opening it sets a signed session cookie that lasts 7 days.
 * Only addresses listed in ADMIN_EMAILS can get a link.
 */

export const SESSION_COOKIE = "cc_admin";
const LINK_MINUTES = 15;
const SESSION_DAYS = 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(s);
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return adminEmails().includes(email.trim().toLowerCase());
}

export async function createLoginToken(email: string) {
  return new SignJWT({ purpose: "login" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${LINK_MINUTES}m`)
    .sign(secret());
}

export async function verifyLoginToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "login" || !payload.sub || !isAdminEmail(payload.sub)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function createSessionCookie(email: string) {
  const token = await new SignJWT({ purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The signed-in admin's email, or null. Re-checks ADMIN_EMAILS every time,
 *  so removing someone from the list signs them out immediately. */
export async function currentAdmin(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "session" || !payload.sub || !isAdminEmail(payload.sub)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** Blocks cross-site form posts to admin endpoints. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    // Behind Railway's proxy the server sees an internal address, so also
    // accept the address the visitor actually used, and the configured site URL.
    const allowed = new Set<string>([new URL(req.url).host]);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host) allowed.add(host.split(",")[0].trim());
    if (process.env.SITE_URL) allowed.add(new URL(process.env.SITE_URL).host);
    if (process.env.RAILWAY_PUBLIC_DOMAIN) allowed.add(process.env.RAILWAY_PUBLIC_DOMAIN);
    return allowed.has(originHost);
  } catch {
    return false;
  }
}
