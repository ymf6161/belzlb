import { NextResponse } from "next/server";
import { createLoginToken, isAdminEmail, sameOrigin } from "@/lib/auth";
import { sendMail } from "@/lib/email";
import { siteUrl } from "@/lib/stripe";
import { getContent } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let email = "";
  try {
    const body = await req.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  } catch {}

  // Same answer whether or not the address is on the list, so the form
  // can't be used to find out who the admins are.
  const ok = NextResponse.json({ ok: true });
  if (!email || !isAdminEmail(email)) return ok;

  try {
    const token = await createLoginToken(email);
    const link = `${siteUrl(req)}/api/admin/verify?token=${encodeURIComponent(token)}`;
    const { centreName } = await getContent();
    await sendMail({
      to: email,
      subject: `Your login link for the ${centreName} website`,
      text: `Hello,\n\nClick this link to open the website admin panel:\n\n${link}\n\nThe link works for 15 minutes. If you didn't ask for it, you can ignore this email.\n`,
    });
  } catch (err: any) {
    console.error("Login email failed:", err?.message ?? err);
    return NextResponse.json({ error: "We couldn't send the email. Please try again." }, { status: 500 });
  }
  return ok;
}
