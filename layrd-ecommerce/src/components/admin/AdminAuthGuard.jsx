"use client";
// ─────────────────────────────────────────────
// LÄYRD – AdminAuthGuard
// Redirects unauthenticated users to /admin/login.
// Wrap any protected admin page content with this.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin-auth";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // WHY this needs to be its own async function: isAdminLoggedIn() is an
    // async function (it awaits a Supabase session lookup + a profiles query),
    // so calling it returns a Promise. The old code did `if (!isAdminLoggedIn())`
    // which checked the truthiness of the Promise OBJECT itself (always true),
    // never the resolved boolean inside it — meaning this guard was never
    // actually blocking anyone. We must await the real result before deciding.
    async function checkAuth() {
      const loggedIn = await isAdminLoggedIn();
      if (!loggedIn) {
        router.replace("/admin/login");
      } else {
        setChecked(true);
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
