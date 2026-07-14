"use client";
// ─────────────────────────────────────────────
// LÄYRD – Reset Password page (/reset-password)
// ─────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { BRAND } from "../../lib/constants.js";
import { resetPasswordForEmail } from "../../lib/auth.js";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    const { error: resetError } = await resetPasswordForEmail(email);
    
    if (resetError) {
      setError(resetError.message || "Failed to send reset email.");
    } else {
      setSuccess(true);
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
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.25em", color: "var(--color-cream)" }}>
              {BRAND.name}
            </span>
          </Link>
          <p style={{ fontSize: "0.78rem", color: "var(--color-sand)", marginTop: "6px", letterSpacing: "0.1em" }}>
            Reset your password
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--color-cream)", marginBottom: "20px" }}>
              A password reset link has been sent to your email address. Please check your inbox.
            </p>
            <Link href="/login">
              <button className="btn btn-primary" style={{ width: "100%" }}>
                Return to Login
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" required placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {error && (
              <p style={{ fontSize: "0.82rem", color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "3px", border: "1px solid rgba(239,68,68,0.15)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="divider" style={{ marginTop: "36px" }} />

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--color-sand)" }}>
          Remember your password?{" "}
          <Link href="/login" style={{ color: "var(--color-accent)" }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
