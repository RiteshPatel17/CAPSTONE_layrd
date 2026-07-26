"use client";
// src/components/cart/CartContext.jsx
//
// WHY React Context (not Redux/Zustand): per TRD section 5, this app
// deliberately avoids state management libraries. This is the ONE global
// cart state the whole customer-facing app shares (Navbar badge, CartSidebar,
// /checkout all read from here).
//
// WHY localStorage persistence: cart must survive a page refresh — losing
// someone's cart because they refreshed would directly hurt conversion
// (PRD Goal: "Checkout completion rate > 70%"). This is safe here because
// this is a real app component, not an Artifact.
//
// NOTE on shape: this context's exported values (totalItems, item.id,
// deliveryFee, promoCode) are dictated by Navbar.jsx and CartSidebar.jsx,
// which were already written against this exact contract — this file is
// built to match THEM, not the other way around.

import { createContext, useContext, useState, useEffect } from "react";
import { DELIVERY_MIN_ITEMS } from "@/lib/constants";

const CartContext = createContext(undefined);

const STORAGE_KEY = "layrd-cart";

export function CartProvider({ children }) {
  // WHY start empty, load in useEffect: Next.js renders once on the server
  // first (no window/localStorage there), then hydrates on the client.
  // Reading localStorage during initial render causes server/client HTML
  // mismatches, which React flags as hydration errors.
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Delivery fee and promo code are cart-level state too, since CartSidebar
  // reads them directly via useCart() to display "Delivery" and "Promo"
  // lines in the totals breakdown. These get SET later from /checkout
  // (delivery fee once distance is calculated) and the promo code input.
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoCode, setPromoCode] = useState(null);

  // WHY separate from deliveryFee: /checkout needs to know WHICH method the
  // user picked (pickup vs delivery) independent of whether a fee has been
  // calculated yet — right after switching to "delivery" but before
  // clicking "Check", deliveryMethod is already "delivery" but deliveryFee
  // is still 0/unset.
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");

  // Load saved cart from localStorage once, on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error("CartContext: failed to load saved cart:", err);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items change — but only AFTER the initial
  // load has finished, otherwise this would immediately overwrite a real
  // saved cart with an empty array before we've had a chance to read it.
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("CartContext: failed to save cart:", err);
    }
  }, [items, isLoaded]);

  /**
   * Adds a product to the cart. If an identical line (same product id +
   * sweetness) already exists, increments its quantity instead of creating
   * a duplicate line.
   *
   * WHY id is built here from productId+sweetness: espresso items can have
   * different sweetness per line (Black vs Sugar), so two lines with the
   * SAME product but DIFFERENT sweetness must stay separate. Cake items have
   * no sweetness, so id just falls back to the product id alone.
   *
   * @param {object} product - { productId, name, flavour, size, category,
   *   type, price, image?, sweetness? }
   * @param {number} quantity - Defaults to 1
   */
  function addItem(product, quantity = 1) {
    const id = product.sweetness
      ? `${product.productId}::${product.sweetness}`
      : product.productId;

    setItems((prevItems) => {
      const existing = prevItems.find((i) => i.id === id);

      if (existing) {
        return prevItems.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }

      return [...prevItems, { ...product, id, quantity }];
    });
  }

  /**
   * Removes a cart line entirely, regardless of quantity.
   */
  function removeItem(id) {
    setItems((prevItems) => prevItems.filter((i) => i.id !== id));
  }

  /**
   * Sets a cart line's quantity directly (used by the +/- steppers in
   * CartSidebar). Auto-removes the line if quantity drops to 0 or below,
   * matching userflow.md 5.2 ("Decrease qty to 0 --> Item removed from cart").
   */
  function updateQuantity(id, quantity) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }

  /**
   * Empties the entire cart. Used after a successful order is placed.
   * Also resets deliveryFee/promoCode, since those are order-specific too.
   */
  function clearCart() {
    setItems([]);
    setDeliveryFee(0);
    setDeliveryMethod("pickup");
    setPromoCode(null);
  }

  // subtotal/totalItems recalculated on every render from current items —
  // WHY not stored as separate state: deriving from items directly means
  // they can never drift out of sync with the actual cart contents.
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // WHY computed here, not in checkout/page.jsx: per PRD FR-05, delivery
  // requires a minimum of 4 items — checkout/page.jsx reads this directly
  // to show/hide the "add more items" warning and gate delivery selection.
  const meetsDeliveryMinimum = totalItems >= DELIVERY_MIN_ITEMS;

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    deliveryFee,
    setDeliveryFee,
    deliveryMethod,
    setDeliveryMethod,
    meetsDeliveryMinimum,
    promoCode,
    setPromoCode,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook for any component to read/modify cart state. Throws if used outside
 * <CartProvider> so a missing provider fails loudly during development
 * instead of a confusing "cannot read property of undefined" error.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}