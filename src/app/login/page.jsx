"use client";
// ─────────────────────────────────────────────
// LÄYRD – Login page (/login)
// ─────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { BRAND } from "../../lib/constants.js";
import { signIn } from "../../lib/auth.js";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { error: signInError } = await signIn({ email: form.email, password: form.password });
    
    if (signInError) {
      setError(signInError.message || "Failed to sign in. Check your credentials.");
    } else {
      import("../../lib/auth.js").then(async ({ getCurrentUser }) => {
        const user = await getCurrentUser();
        if (user?.profile?.role === "admin") {
          router.push("/admin/orders");
        } else {
          router.push("/"); 
        }
      });
    }
    
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "48px 40px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <Link href="/">
            <span style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "0.25em", color: "var(--color-cream)" }}>
              {BRAND.name}
            </span>
          </Link>
          <p style={{ fontSize: "16px", color: "var(--color-sand)", marginTop: "6px", letterSpacing: "0.1em" }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="label" style={{ margin: 0 }}>Password</label>
              <Link href="/reset-password" style={{ fontSize: "14px", color: "var(--color-accent)" }}>
                Forgot password?
              </Link>
            </div>
            <input className="input" type="password" required placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && (
            <p style={{ fontSize: "16px", color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "3px", border: "1px solid rgba(239,68,68,0.15)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: "center", fontSize: "16px", color: "var(--color-sand)" }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "var(--color-accent)" }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
