import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { getContent } from "@/lib/storage";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const content = await getContent();
  return <Editor initial={content} admin={admin} />;
}
