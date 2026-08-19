"use client";
// ─────────────────────────────────────────────
// LÄYRD – AdminAuthGuard
// Uses the SAME Supabase Auth session as the customer /login page.
// Redirects to /login (not a separate admin login) if there's no
// session, or if the logged-in user's profile role isn't "admin".
// Wrap any protected admin page content with this.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        if (pathname && pathname.startsWith("/admin/")) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        } else {
          router.replace("/login");
        }
        return;
      }
      if (user.profile?.role !== "admin") {
        router.replace("/");
        return;
      }
      setChecked(true);
    }
    checkAuth();
  }, [router]);

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