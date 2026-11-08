import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { getContent } from "@/lib/storage";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const { centreName } = await getContent();
  return (
    <main className="login">
      <div className="login-card fade">
        <p className="eyebrow">{centreName} · Admin</p>
        <h1>Log in to <span className="serif">edit the site</span></h1>
        <p className="muted">We’ll email you a link. It works for 15 minutes, no password needed.</p>
        {error === "expired" && (
          <p className="alert" role="alert">That link has expired or isn’t valid. Ask for a new one below.</p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
