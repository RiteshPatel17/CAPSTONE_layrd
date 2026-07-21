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
import { useState } from "react";
import { LogOut, User, Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { logoutAdmin } from "@/lib/admin-auth";

export default function AdminLayout({ title, subtitle, actions, children }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        }}>
        {/* ── Overlay for Mobile Sidebar ── */}
        <div 
          className={`admin-overlay ${isMobileMenuOpen ? 'open' : ''} md:hidden`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* ── Sidebar ── */}
        <AdminSidebar 
          onLogout={handleLogout} 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />

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
            {/* Mobile Hamburger + Page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                className="md:hidden" 
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
              >
                <Menu size={24} />
              </button>
              <div>
              {title && (
                <h1 style={{
                  fontSize: "20px",
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
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "1px",
                  margin: 0,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
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
                  fontSize: "14px",
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
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
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
            overflowX: "hidden"
          }}
          className="max-md:px-4 max-md:py-6"
          >
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}