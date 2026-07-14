"use client";
// ─────────────────────────────────────────────
// LÄYRD – AdminLayout (AdminShell)
// Wraps every protected admin page with:
//   - AdminAuthGuard (redirects to /admin/login if not authenticated)
//   - Left sidebar (AdminSidebar)
//   - Top bar with page title, theme toggle, logout button, admin profile
//   - Scrollable content area
//
// Usage:
//   <AdminLayout title="Products" subtitle="Manage your catalogue">
//     {content}
//   </AdminLayout>
// ─────────────────────────────────────────────
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { logoutAdmin } from "@/lib/admin-auth";

export default function AdminLayout({ title, subtitle, actions, children }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <AdminAuthGuard>
      <div style={{
        display: "flex",
        minHeight: "100vh",
        /* Admin content area uses the global theme variables */
        background: "var(--bg-main)",
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* ── Sidebar ── */}
        <AdminSidebar onLogout={handleLogout} />

        {/* ── Main column ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}>

          {/* ── Top bar ── */}
          <header style={{
            height: "56px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            borderBottom: "1px solid var(--border-soft)",
            /* Topbar uses soft background — adapts between cream (day) and charcoal (night) */
            background: "var(--bg-soft)",
          }}>
            {/* Page title */}
            <div>
              {title && (
                <h1 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  letterSpacing: "0.01em",
                  margin: 0,
                }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "1px",
                  margin: 0,
                }}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right side: actions + theme toggle + profile + logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {actions}

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Admin avatar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 10px",
                border: "1px solid var(--border-soft)",
                borderRadius: "4px",
                background: "var(--surface)",
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <User size={12} strokeWidth={2} style={{ color: "#FFFFFF" }} />
                </div>
                <span style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}>
                  Adam
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  background: "transparent",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "4px",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "border-color 0.2s, color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#dc2626";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-soft)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <LogOut size={13} strokeWidth={1.5} />
                Log out
              </button>
            </div>
          </header>

          {/* ── Page content ── */}
          <main style={{
            flex: 1,
            padding: "32px 36px",
            overflowY: "auto",
          }}>
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
