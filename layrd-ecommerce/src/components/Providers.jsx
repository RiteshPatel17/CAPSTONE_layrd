"use client";
// src/components/Providers.jsx
//
// WHY this file exists (per TRD 4.2 "Two-Shell Layout Architecture"):
// Admin routes (/admin/*) need a completely different shell (dark sidebar,
// no cart) than customer-facing routes (Navbar + CartSidebar + Footer).
// This component checks the current path and renders the correct shell —
// the two shells NEVER mix, so there's no risk of admin UI leaking into
// customer pages or vice versa.

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { CartProvider } from "./cart/CartContext.jsx";
import CartSidebar from "./cart/CartSidebar.jsx";
import Navbar from "./layout/Navbar.jsx";
import Footer from "./layout/Footer.jsx";
import { loadPricingSettings } from "@/lib/pricing";

export default function Providers({ children }) {
  const pathname = usePathname();

  // WHY check pathname here: admin routes bypass the customer shell
  // entirely (TRD 4.2) — no Navbar, no CartSidebar, no Footer, no
  // CartProvider even wrapping them, since admin doesn't need cart state.
  const isAdmin = pathname.startsWith("/admin");

  // WHY loadPricingSettings() is called here, once, on mount: this is the
  // component that wraps the entire customer-facing app, so it's the
  // earliest safe place to kick off the settings fetch (gst_rate,
  // delivery_tiers) before any cart/checkout math might need it. Per the
  // cache design in pricing.js, getCartTotals() reads from this cache
  // synchronously — it doesn't wait for this fetch itself, so there's a
  // brief window where cart totals might use fallback defaults if a
  // calculation happens before this resolves. That's an acceptable tradeoff
  // for keeping getCartTotals() synchronous.
  useEffect(() => {
    loadPricingSettings();
  }, []);

  // Admin routes: render children directly, no customer shell at all.
  // AdminLayout/AdminSidebar (built on Day 2) handle admin's own UI shell.
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <CustomerShell>{children}</CustomerShell>
    </CartProvider>
  );
}

/**
 * Separated into its own component (rather than inline in Providers) so
 * that useCart() can be called here — it needs CartProvider to already be
 * an ancestor in the tree, which wouldn't be true if this logic lived
 * directly inside Providers() above the <CartProvider> wrapper.
 */
function CustomerShell({ children }) {
  // Controls whether the CartSidebar is open or closed — lives here since
  // both Navbar (the button that opens it) and CartSidebar (the panel
  // itself) are siblings that both need access to this same state.
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <Navbar openCart={() => setIsCartOpen(true)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <main>{children}</main>
      <Footer />
    </>
  );
}