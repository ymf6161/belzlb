import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { SiteContent, withDefaults } from "@/lib/content";

/**
 * Content is one JSON file, with uploaded photos in a folder beside it.
 *
 * On Railway these live on a Volume (a persistent disk), so they survive
 * redeploys. The folder is, in order of preference:
 *   1. DATA_DIR, if set
 *   2. RAILWAY_VOLUME_MOUNT_PATH, set automatically when a Volume is attached
 *   3. ./data, for local development
 *
 *   <data folder>/content.json
 *   <data folder>/uploads/<photo files>   → served at /media/<name>
 */

export function dataDir(): string {
  return process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), "data");
}
const contentFile = () => path.join(dataDir(), "content.json");
const uploadsDir = () => path.join(dataDir(), "uploads");

/** In production, refuse to save to the app's own folder, which is wiped on
 *  every redeploy. Saving only works once a Volume is attached. */
function assertPersistent() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.RAILWAY_ENVIRONMENT_NAME &&
    !process.env.DATA_DIR &&
    !process.env.RAILWAY_VOLUME_MOUNT_PATH
  ) {
    throw new Error("No Railway Volume is attached, so changes would be lost on the next deploy. Attach a Volume (see README).");
  }
}

export async function getContent(): Promise<SiteContent> {
  try {
    return withDefaults(JSON.parse(await fs.readFile(contentFile(), "utf8")));
  } catch (err: any) {
    if (err?.code !== "ENOENT") console.error("Could not load content, using defaults:", err);
    return withDefaults(null);
  }
}

/** Writes to a temporary file, then renames it, so a crash mid-save
 *  can never leave a half-written content file. */
export async function saveContent(content: SiteContent): Promise<void> {
  assertPersistent();
  const file = contentFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(content, null, 2), "utf8");
  // Keep the previous version as a simple backup.
  await fs.copyFile(file, `${file}.bak`).catch(() => {});
  await fs.rename(tmp, file);
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const EXT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
export const IMAGE_NAME = /^[0-9]+-[a-f0-9]{12}\.(jpg|png|webp|avif)$/;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Checks the file really is the image type it claims to be. */
function looksLike(type: string, b: Buffer): boolean {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === "image/png") return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP";
  if (type === "image/avif") return b.subarray(4, 12).toString().startsWith("ftypavi");
  return false;
}

export async function saveImage(file: File): Promise<string> {
  assertPersistent();
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be under 4 MB.");
  const data = Buffer.from(await file.arrayBuffer());
  if (!looksLike(file.type, data)) throw new Error("That file doesn't look like a valid image.");
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), name), data);
  return `/media/${name}`;
}

export async function readImage(name: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!IMAGE_NAME.test(name)) return null;
  try {
    const data = await fs.readFile(path.join(uploadsDir(), name));
    return { data, contentType: EXT_TYPES[name.split(".").pop()!] };
  } catch {
    return null;
  }
}
