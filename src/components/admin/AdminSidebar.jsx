"use client";
// ─────────────────────────────────────────────
// LÄYRD – AdminSidebar
// Left navigation for all /admin pages.
// Always dark background (professional dashboard convention).
// Uses lucide-react icons.
// ─────────────────────────────────────────────
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  CalendarDays,
  Sparkles,
  Building2,
  BadgeCheck,
  Tag,
  Clock,
  CircleHelp,
  Settings,
  ArrowLeft,
  X
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin",                label: "Dashboard",      Icon: LayoutDashboard },
  { href: "/admin/products",       label: "Products",       Icon: Package },
  { href: "/admin/inventory",      label: "Inventory",      Icon: Boxes },
  { href: "/admin/orders",         label: "Orders",         Icon: ClipboardList },
  { href: "/admin/events",         label: "Events",         Icon: CalendarDays },
  { href: "/admin/ai-labels",      label: "AI Labels",      Icon: Sparkles },
  { href: "/admin/wholesale",      label: "Wholesale",      Icon: Building2 },
  { href: "/admin/business-codes", label: "Business Codes", Icon: BadgeCheck },
  { href: "/admin/promo-codes",    label: "Promo Codes",    Icon: Tag },
  { href: "/admin/availability",   label: "Availability",   Icon: Clock },
  { href: "/admin/faq",            label: "FAQ",            Icon: CircleHelp },
  { href: "/admin/settings",       label: "Settings",       Icon: Settings },
];

export default function AdminSidebar({ onLogout, isOpen, onClose }) {
  const pathname = usePathname();

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`} style={{
      width: "220px",
      flexShrink: 0,
      minHeight: "100vh",
      background: "#0E0E0E",
      borderRight: "1px solid rgba(232,223,210,0.12)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Brand header ── */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "1px solid rgba(232,223,210,0.12)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
        <div style={{
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "0.22em",
          color: "#FAF8F3",
          lineHeight: "100%",
        }}>
          LÄYRD
        </div>
        <div style={{
          fontSize: "24px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#77736B",
          marginTop: "5px",
        }}>
          Admin Panel
        </div>
        </div>
        {/* Mobile close button (only visible if we want, but typically hidden on desktop by CSS, or we can just render it conditionally or let CSS hide it) */}
        {isOpen && (
          <button 
            onClick={onClose}
            className="md:hidden"
            style={{
              background: 'none', border: 'none', color: '#77736B', cursor: 'pointer', padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ display: "block" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 20px",
                fontSize: "16px",
                fontWeight: active ? 500 : 400,
                color: active ? "#FAF8F3" : "#A19D94",
                background: active ? "rgba(184,155,94,0.12)" : "transparent",
                borderLeft: `3px solid ${active ? "#B89B5E" : "transparent"}`,
                transition: "color 0.15s, background 0.15s, border-color 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#FAF8F3";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "#A19D94";
                  e.currentTarget.style.background = "transparent";
                }
              }}
              >
                <item.Icon
                  size={16}
                  strokeWidth={active ? 2 : 1.5}
                  style={{
                    color: active ? "#B89B5E" : "#A19D94",
                    flexShrink: 0,
                  }}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid rgba(232,223,210,0.12)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        {/* Back to store */}
        <Link href="/" style={{ display: "block" }}>
          <div style={{
            fontSize: "14px",
            color: "#77736B",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#E8DFD2"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#77736B"}
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Back to Store
          </div>
        </Link>
      </div>
    </aside>
  );
}