import { promises as fs } from "fs";
import { dataDir } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Railway's healthcheck. Also confirms the data folder can be written to. */
export async function GET() {
  try {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.access(dataDir(), fs.constants.W_OK);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Data folder is not writable" }, { status: 503 });
  }
}
