import { NextResponse } from "next/server";
import { clearSession, sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

/** Relative redirect, so it works behind a proxy that hides the public address. */
const redirectTo = (path: string) => new NextResponse(null, { status: 303, headers: { Location: path } });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await clearSession();
  return redirectTo("/admin/login");
}
