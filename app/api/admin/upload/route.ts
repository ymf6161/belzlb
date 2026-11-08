import { NextResponse } from "next/server";
import { currentAdmin, sameOrigin } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await currentAdmin()))
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const url = await saveImage(file);
    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Upload failed." }, { status: 400 });
  }
}
