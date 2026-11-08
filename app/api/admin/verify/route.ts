import { NextResponse } from "next/server";
import { createSessionCookie, verifyLoginToken } from "@/lib/auth";

export const runtime = "nodejs";

/** Relative redirect, so it works behind a proxy that hides the public address. */
const redirectTo = (path: string) => new NextResponse(null, { status: 303, headers: { Location: path } });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = await verifyLoginToken(url.searchParams.get("token") ?? "");
  if (!email) return redirectTo("/admin/login?error=expired");
  await createSessionCookie(email);
  return redirectTo("/admin");
}
