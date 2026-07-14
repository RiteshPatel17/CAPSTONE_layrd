"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Login (/admin/login)
// Standalone page — no customer navbar or footer.
// Auth: database-backed HttpOnly cookie session via /api/admin/login
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ identifier: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If already has a valid session, skip straight to dashboard
  useEffect(() => {
    // Clear any stale localStorage from old mock auth system
    if (typeof window !== "undefined") {
      localStorage.removeItem("layrd_admin_session");
    }
    fetch("/api/admin/verify")
      .then(r => {
        if (r.ok) router.replace("/admin");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  // Show nothing while checking existing session
  if (checking) return null;

  function handleField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Small artificial delay so the button state is visible
    setTimeout(async () => {
      try {
        const result = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }).then(r => r.json());

        if (result.success) {
          // Session is now managed by HttpOnly cookie set by the server
          router.replace("/admin");
        } else {
          setError(result.error || "Invalid credentials");
          setLoading(false);
        }
      } catch (err) {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-main)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        animation: "fadeIn 0.3s ease both",
      }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "2.2rem",
            fontWeight: 700,
            letterSpacing: "0.28em",
            color: "var(--text-main)",
            marginBottom: "6px",
          }}>
            LÄYRD
          </div>
          <div style={{
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            Admin Portal
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "6px",
          padding: "40px 36px",
        }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.4rem",
            fontWeight: 500,
            color: "var(--text-main)",
            marginBottom: "28px",
          }}>
            Sign in
          </h3>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-sand)",
                marginBottom: "8px",
              }}>
                Admin ID or Email
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.identifier}
                onChange={(e) => handleField("identifier", e.target.value)}
                placeholder="admin or admin@layrd.org"
                className="input"
                style={{
                  width: "100%",
                  border: error ? "1px solid rgba(239,68,68,0.4)" : undefined,
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-sand)",
                marginBottom: "8px",
              }}>
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => handleField("password", e.target.value)}
                placeholder="••••••••"
                className="input"
                style={{
                  width: "100%",
                  border: error ? "1px solid rgba(239,68,68,0.4)" : undefined,
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "4px",
                fontSize: "0.83rem",
                color: "#f87171",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "rgba(201,169,110,0.5)" : "var(--color-accent)",
                border: "none",
                borderRadius: "4px",
                color: "var(--color-black)",
                fontSize: "0.82rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "background 0.2s, transform 0.15s",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#d4b47a"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "var(--color-accent)"; }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Demo note */}
        <p style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "0.72rem",
          color: "var(--color-muted)",
          letterSpacing: "0.03em",
        }}>
          Demo admin login — development only.
        </p>
      </div>
    </div>
  );
}
