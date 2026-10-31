"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setState("error"); setError("Enter a valid email address."); return; }
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setState("error"); setError(error.message); } else setState("sent");
  }

  return (
    <div className="card" style={{ maxWidth: 440, margin: "32px auto" }}>
      <h1 style={{ fontSize: 26 }}>Sign in</h1>
      <p className="hint" style={{ fontSize: 15, marginTop: 0 }}>We'll email you a sign-in link. No password needed.</p>
      {state === "sent" ? (
        <p className="msg ok">Check your inbox for a link from ZapApply. You can close this tab.</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} />
          </div>
          {state === "error" && <p className="msg err">{error}</p>}
          <button className="btn" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a link"}</button>
        </form>
      )}
    </div>
  );
}
