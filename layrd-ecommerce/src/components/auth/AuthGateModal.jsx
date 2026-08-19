"use client";
// ─────────────────────────────────────────────
// LÄYRD – Auth Gate Modal
// Login/signup modal used to require an account before checkout,
// contact, etc. Closable via the X in the corner — closing it just
// cancels the attempted action and lets the user keep browsing.
// ─────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { signIn, signUp } from "../../lib/auth.js";

export default function AuthGateModal({ open, onAuthenticated, onClose, subtitle }) {
  const [tab, setTab] = useState("login"); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ fullName: "", email: "", password: "", confirm: "" });

  if (!open) return null;

  function switchTab(next) {
    setTab(next);
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signInError } = await signIn({ email: loginForm.email, password: loginForm.password });

    if (signInError) {
      setError(signInError.message || "Failed to sign in. Check your credentials.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onAuthenticated(data.session);
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (signupForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: signUpError } = await signUp({
      email: signupForm.email,
      password: signupForm.password,
      fullName: signupForm.fullName,
    });

    if (signUpError) {
      setError(signUpError.message || "Failed to create account.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSignupDone(true);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%", maxWidth: "440px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "40px 32px",
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute", top: "16px", right: "16px",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: "4px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={22} />
          </button>
        )}

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h3 style={{ fontSize: "26px", color: "var(--text-main)", marginBottom: "8px" }}>
            {signupDone ? "Check your email" : "Sign in to continue"}
          </h3>
          {!signupDone && (
            <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>
              {subtitle || "You need an account to continue."}
            </p>
          )}
        </div>

        {signupDone ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "17px", color: "var(--text-muted)", marginBottom: "24px" }}>
              We've sent a confirmation link to <strong style={{ color: "var(--text-main)" }}>{signupForm.email}</strong>.
              Confirm your account, then log in below to continue.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => { setSignupDone(false); switchTab("login"); }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--bg-soft)", borderRadius: "6px", padding: "4px" }}>
              <button
                type="button"
                onClick={() => switchTab("login")}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "4px", cursor: "pointer",
                  fontWeight: 600, fontSize: "15px",
                  background: tab === "login" ? "var(--accent)" : "transparent",
                  color: tab === "login" ? "#fff" : "var(--text-muted)",
                }}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => switchTab("signup")}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "4px", cursor: "pointer",
                  fontWeight: 600, fontSize: "15px",
                  background: tab === "signup" ? "var(--accent)" : "transparent",
                  color: tab === "signup" ? "#fff" : "var(--text-muted)",
                }}
              >
                Sign Up
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" required placeholder="you@example.com"
                    value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label className="label" style={{ margin: 0 }}>Password</label>
                    <Link href="/reset-password" style={{ fontSize: "14px", color: "#2563EB", textDecoration: "underline" }}>
                      Forgot password?
                    </Link>
                  </div>
                  <input className="input" type="password" required placeholder="••••••••"
                    value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                {error && (
                  <p style={{ fontSize: "15px", color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "3px", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" required placeholder="Jane Doe"
                    value={signupForm.fullName} onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" required placeholder="you@example.com"
                    value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" required placeholder="Min. 8 characters"
                    value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" required placeholder="••••••••"
                    value={signupForm.confirm} onChange={(e) => setSignupForm({ ...signupForm, confirm: e.target.value })} />
                </div>
                {error && (
                  <p style={{ fontSize: "15px", color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "3px", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
