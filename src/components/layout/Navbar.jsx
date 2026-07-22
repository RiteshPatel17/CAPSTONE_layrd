"use client";
// ─────────────────────────────────────────────
// LÄYRD – Navbar
// Sticky top navigation with cart icon and Day/Night toggle
// ─────────────────────────────────────────────
import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, User, LogOut } from "lucide-react";
import { useCart } from "../cart/CartContext.jsx";
import { NAV_LINKS, BRAND } from "../../lib/constants.js";
import ThemeToggle from "./ThemeToggle.jsx";
import { getCurrentUser, signOut } from "../../lib/auth.js";
import { supabase } from "../../lib/supabase.js";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch current user initially and listen for changes
    async function checkUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        checkUser();
      }
    });

    // 2. Setup inactivity timer (e.g. 15 minutes = 900,000 ms)
    const INACTIVITY_LIMIT = 15 * 60 * 1000; 
    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        // If logged in, log them out
        const currentUser = await getCurrentUser();
        if (currentUser) {
          await signOut();
          setUser(null);
          router.push("/login?reason=timeout");
        }
      }, INACTIVITY_LIMIT);
    };

    // Attach event listeners to reset timer on activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("click", resetTimer);

    // Initial start
    resetTimer();

    return () => {
      authListener?.subscription.unsubscribe();
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [router]);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    router.push("/");
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-brand" aria-label="LÄYRD home">
          <img
            src="/layrd-swirl.png"
            alt=""
            aria-hidden="true"
            className="navbar-brand-symbol"
          />
          <span className="navbar-brand-wordmark">{BRAND.name}</span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "16px",
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
        <div className="navbar-actions">
          {/* Theme toggle */}
          <div className="hide-on-mobile">
            <ThemeToggle />
          </div>

          {/* User Auth */}
          {user ? (
            <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                href="/profile"
                aria-label="Open account"
                title="Open account"
                style={{
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  width: "44px",
                  height: "44px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              >
                <User size={24} strokeWidth={1.5} />
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign Out"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.2s",
                  width: "44px",
                  height: "44px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                <LogOut size={24} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Log in"
              title="Log in"
              className="hide-on-mobile"
              style={{
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
                width: "44px",
                height: "44px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              <User size={24} strokeWidth={1.5} />
            </Link>
          )}

          {/* Cart button */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            title="Open cart"
            suppressHydrationWarning
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "24px",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "var(--text-primary)",
              padding: "8px 16px",
              minHeight: "44px",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-primary)";
              e.currentTarget.style.color = "var(--accent-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            <ShoppingBag size={24} strokeWidth={1.5} />
            <span className="cart-label" style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "0.05em" }}>Cart</span>

            {/* Cart count badge */}
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "var(--accent-primary)",
                  color: "var(--color-white)",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--surface-primary)",
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
              padding: "10px",
              width: "44px",
              height: "44px",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            title="Toggle menu"
          >
            {menuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
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
          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>Theme</span>
            <ThemeToggle />
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "20px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: "20px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Profile ({user.profile?.full_name || user.email?.split("@")[0]})
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                style={{
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontSize: "20px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "20px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              Login
            </Link>
          )}
        </div>
      )}



    </nav>
  );
}
