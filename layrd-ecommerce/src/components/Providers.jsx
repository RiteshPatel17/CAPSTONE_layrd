"use client";
// ─────────────────────────────────────────────
// LÄYRD – Providers (client component)
// Wraps customer pages with CartProvider, Navbar, CartSidebar, Footer.
//
// Admin routes (/admin/*) bypass the customer shell entirely —
// they render their own AdminShell with sidebar and topbar.
// ─────────────────────────────────────────────
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/components/cart/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/cart/CartSidebar";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  const pathname = usePathname();

  // Admin pages handle their own layout — no customer shell needed
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Navbar />
      <CartSidebar />
      <Toaster position="top-center" />
      <main style={{ minHeight: "calc(100vh - 72px - 300px)" }}>
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
