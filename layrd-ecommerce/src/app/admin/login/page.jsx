"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Login (/admin/login)
// Standalone page — no customer navbar or footer.
// Real Supabase Auth via loginAdmin() (src/lib/admin-auth.js).
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, isAdminLoggedIn } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, skip straight to dashboard.
  // WHY this must be awaited: isAdminLoggedIn() is an async function (it
  // queries Supabase for the session + profile role), so calling it returns
  // a Promise. A Promise object is always truthy, so checking
  // `if (isAdminLoggedIn())` without awaiting it was ALWAYS true — meaning
  // this page redirected to /admin on every single visit, even for users
  // with no session at all. That's the actual cause of the /admin/orders →
  // /admin/login → /admin redirect loop.
  useEffect(() => {
    async function checkAlreadyLoggedIn() {
      const loggedIn = await isAdminLoggedIn();
      if (loggedIn) router.replace("/admin");
    }
    checkAlreadyLoggedIn();
  }, [router]);

  function handleField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // WHY this is now async/await instead of the old setTimeout+sync call:
    // loginAdmin() does two real network round-trips (Supabase sign-in, then
    // a profiles table lookup to verify role === 'admin'), so it MUST be
    // awaited. It also throws an Error on failure (wrong password, non-admin
    // account, etc.) rather than returning { success, error } — that shape
    // was leftover from the old mock version and no longer matches what
    // admin-auth.js actually does. We catch the thrown error and show its
    // .message to the user instead.
    try {
      await loginAdmin(form.email, form.password);
      router.replace("/admin");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
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
        {/* WHY --bg-card instead of the old --surface: --surface was never
            actually defined in globals.css (a ghost variable), so this
            silently resolved to nothing and the card had no visible
            background. --bg-card is the real design-system token for
            card/modal surfaces (White in day mode, Dark Grey in night mode). */}
        <div style={{
          background: "var(--bg-card)",
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
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleField("email", e.target.value)}
                placeholder="admin@layrd.org"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#0d0d0d",
                  border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
                  borderRadius: "4px",
                  /* WHY --text-main instead of the old --color-cream: --color-cream
                     was never defined in globals.css (a ghost variable), so this
                     resolved to nothing and typed text inherited an unset color,
                     making it invisible against the dark #0d0d0d input background.
                     --text-main is the real primary-text token. */
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { if (!error) e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e)  => { if (!error) e.target.style.borderColor = "var(--border)"; }}
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
                color: "var(--text-muted)",
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
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#0d0d0d",
                  border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
                  borderRadius: "4px",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { if (!error) e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e)  => { if (!error) e.target.style.borderColor = "var(--border)"; }}
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
                background: loading ? "rgba(201,169,110,0.5)" : "var(--accent)",
                border: "none",
                borderRadius: "4px",
                /* WHY a hardcoded hex instead of a variable: this text sits on
                   top of the gold accent button. Gold (--accent) is the one
                   color that stays IDENTICAL in both day and night mode (per
                   uxui-brief.md 2.2), so the text on top of it also needs to
                   stay constant — there's no "--text-inverse" token defined
                   for that in globals.css. Same reasoning as why AdminSidebar
                   hardcodes its always-dark colors instead of using theme vars. */
                color: "#0E0E0E",
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
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent)"; }}
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
          color: "var(--text-muted)",
          letterSpacing: "0.03em",
        }}>
          Demo admin login — development only.
        </p>
      </div>
    </div>
  );
}