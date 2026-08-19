"use client";
// ─────────────────────────────────────────────
// LÄYRD – Navbar
// Sticky top navigation with cart icon and Day/Night toggle
// ─────────────────────────────────────────────
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "../cart/CartContext.jsx";
import { NAV_LINKS, BRAND } from "../../lib/constants.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar({ openCart }) {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.7rem",
              fontWeight: 700,
              letterSpacing: "0.25em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            {BRAND.name}
          </span>
        </Link>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: theme toggle + auth + cart */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Login */}
          <Link
            href="/login"
            style={{
              fontSize: "0.78rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <User size={15} strokeWidth={1.5} />
            <span className="login-label">Login</span>
          </Link>

          {/* Cart button */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              color: "var(--text-primary)",
              padding: "4px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          >
            <ShoppingBag size={22} strokeWidth={1.5} />

            {/* Cart count badge */}
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "var(--accent-primary)",
                  color: "var(--color-white)",
                  borderRadius: "50%",
                  width: "17px",
                  height: "17px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
              display: "none",
              padding: "4px",
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "72px",
            left: 0,
            right: 0,
            background: "var(--surface-primary)",
            borderBottom: "1px solid var(--border-soft)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 99,
            boxShadow: "0 8px 24px rgba(14,14,14,0.08)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "0.9rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: "0.9rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          >
            Login
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .login-label { display: none; }
        }
      `}</style>
    </nav>
  );
}
