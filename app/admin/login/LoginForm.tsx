"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState("sent");
    } catch (err: any) {
      setMessage(err.message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="sent fade" role="status">
        <strong>Check your inbox.</strong> If {email} is on the admin list, a login link is on its way.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="login-form">
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="a-input"
      />
      {state === "error" && <p className="alert" role="alert">{message}</p>}
      <button type="submit" className="a-btn primary" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a login link"}
      </button>
    </form>
  );
}
