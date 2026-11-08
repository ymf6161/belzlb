import { NextResponse } from "next/server";
import { adminEmails, currentAdmin, sameOrigin } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/storage";
import { sanitizeContent } from "@/lib/content";
import { sendMail } from "@/lib/email";
import { siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const previous = await getContent();
  const next = sanitizeContent(input, previous);
  next.updatedAt = new Date().toISOString();
  next.updatedBy = admin;

  try {
    await saveContent(next);
  } catch (err: any) {
    console.error("Save failed:", err?.message ?? err);
    const msg = String(err?.message ?? "").startsWith("No Railway Volume") ? err.message : "Saving failed. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Alert every admin when the Gift Aid setting changes.
  if (previous.donations.giftAidEnabled !== next.donations.giftAidEnabled) {
    const state = next.donations.giftAidEnabled ? "switched ON" : "switched OFF";
    const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
    try {
      await sendMail({
        to: adminEmails(),
        subject: `Gift Aid was ${state} on the ${next.centreName} website`,
        text: `Gift Aid on the donation form was ${state} by ${admin} at ${when} (UK time).\n\nIf this wasn't expected, log in at ${siteUrl(req)}/admin and check the Donations tab.\n`,
      });
    } catch (err: any) {
      console.error("Gift Aid alert failed:", err?.message ?? err);
    }
  }

  return NextResponse.json({ ok: true, content: next });
}
