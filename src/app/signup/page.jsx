"use client";
// ─────────────────────────────────────────────
// LÄYRD – Signup page (/signup)
// ─────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { BRAND } from "../../lib/constants.js";
import { signUp } from "../../lib/auth.js";

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    
    const { error: signUpError } = await signUp({ 
      email: form.email, 
      password: form.password, 
      fullName: form.fullName 
    });

    if (signUpError) {
      setError(signUpError.message || "Failed to create account.");
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "440px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "48px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <Link href="/"><span style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "0.25em", color: "var(--color-cream)" }}>{BRAND.name}</span></Link>
          <p style={{ fontSize: "16px", color: "var(--color-sand)", marginTop: "6px", letterSpacing: "0.1em" }}>Create your account</p>
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✉</div>
            <h3 style={{ marginBottom: "12px" }}>Check your email</h3>
            <p style={{ fontSize: "20px", color: "var(--color-sand)" }}>We've sent a confirmation link to <strong style={{ color: "var(--color-cream)" }}>{form.email}</strong></p>
            <Link href="/login"><button className="btn btn-primary" style={{ marginTop: "28px" }}>Back to Login</button></Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input" required placeholder="Jane Doe" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type="password" required placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            </div>
            {error && <p style={{ fontSize: "16px", color: "#f87171" }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {!done && (
          <>
            <div className="divider" />
            <p style={{ textAlign: "center", fontSize: "16px", color: "var(--color-sand)" }}>
              Already have an account?{" "}<Link href="/login" style={{ color: "var(--color-accent)" }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
