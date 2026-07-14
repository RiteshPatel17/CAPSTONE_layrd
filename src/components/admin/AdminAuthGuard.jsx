"use client";
// ─────────────────────────────────────────────
// LÄYRD – AdminAuthGuard
// Redirects unauthenticated users to /admin/login.
// Wrap any protected admin page content with this.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/verify");
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        setChecked(true);
      } catch (err) {
        // Clear any stale localStorage to prevent redirect loops
        if (typeof window !== "undefined") {
          localStorage.removeItem("layrd_admin_session");
        }
        router.replace("/admin/login");
      }
    }
    checkAuth();
  }, [router]);

  // Avoid flash of content before redirect
  if (!checked) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid var(--border)",
          borderTopColor: "var(--color-accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
      
      </div>
    );
  }

  return <>{children}</>;
}
