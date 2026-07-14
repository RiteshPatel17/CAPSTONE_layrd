"use client";
// ─────────────────────────────────────────────
// LÄYRD – Reset Password Confirm page (/reset-password-confirm)
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import Link from "next/link";
import { BRAND } from "../../lib/constants.js";
import { updatePassword, signOut } from "../../lib/auth.js";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleUpdate(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    
    const { error: updateError } = await updatePassword(password);
    
    if (updateError) {
      setError(updateError.message || "Failed to update password. Link may have expired.");
    } else {
      toast.success("Password updated successfully");
      await signOut();
      router.push("/login");
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
            Set a new password
          </p>
        </div>

        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          
          <div>
            <label className="label">Confirm New Password</label>
            <input className="input" type="password" required placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {error && (
            <p style={{ fontSize: "0.82rem", color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "3px", border: "1px solid rgba(239,68,68,0.15)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

      </div>
    </div>
  );
}
