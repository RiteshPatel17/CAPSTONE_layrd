// src/lib/pricing.js
//
// WHY a settings CACHE instead of pure functions with no side effects:
// CartSidebar.jsx (already written) calls getCartTotals() SYNCHRONOUSLY —
// it expects an object back immediately, not a Promise. But GST rate and
// delivery tiers live in Supabase's settings table (admin-editable, per
// PRD FR-25), and fetching from Supabase is inherently async. The fix:
// fetch settings ONCE when the app loads (via loadPricingSettings(), called
// from Providers.jsx), cache them in this module-level variable, and let
// getCartTotals() read the cache synchronously. This keeps Supabase as the
// single source of truth WITHOUT breaking existing UI code that expects
// synchronous math.

import { supabase } from "./supabase";

// Module-level cache — persists for the lifetime of the page/session.
// WHY sensible hardcoded fallbacks: if Supabase hasn't loaded yet (e.g. a
// component renders before loadPricingSettings() finishes) or the fetch
// fails, we still need SOME numbers to calculate with rather than crashing
// checkout entirely. These match our current real seeded values.
let cachedSettings = {
  gstRate: 5.0, // percent, e.g. 5.0 = 5%
  deliveryTiers: [
    { maxKm: 5, fee: 5 },
    { maxKm: 15, fee: 10 },
    { maxKm: 999999, fee: 15 },
  ],
  loaded: false,
};

/**
 * Fetches gst_rate and delivery_tiers from the settings table (row id=1)
 * and stores them in the module-level cache. MUST be called once, early,
 * before any checkout/cart math happens — Providers.jsx calls this on app
 * load (see next step).
 *
 * WHY this is safe to call more than once: if Providers.jsx re-renders or
 * this gets called again for any reason, it just re-fetches and overwrites
 * the cache with fresh values — no harmful side effects from repeated calls.
 */
export async function loadPricingSettings() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("gst_rate, delivery_tiers")
      .eq("id", 1)
      .single();

    if (error) throw error;

    cachedSettings = {
      gstRate: Number(data.gst_rate),
      deliveryTiers: data.delivery_tiers,
      loaded: true,
    };
  } catch (err) {
    // WHY we don't throw here: a failed settings fetch should NOT crash the
    // app. We keep using the hardcoded fallback values defined above instead
    // — same "never break checkout" philosophy as maps.js's mock fallback.
    console.error("pricing.js: failed to load settings from Supabase, using fallback values:", err.message);
  }
}

/**
 * Calculates the delivery fee for a given distance, using the cached
 * delivery tiers (loaded from settings.delivery_tiers via loadPricingSettings()).
 *
 * @param {number} distanceKm - Real driving distance from getDeliveryDistance()
 * @returns {number} The delivery fee in dollars
 */
export function getDeliveryFee(distanceKm) {
  const tiers = cachedSettings.deliveryTiers;
  const tier = tiers.find((t) => distanceKm <= t.maxKm);
  if (!tier) {
    return tiers[tiers.length - 1]?.fee ?? 0;
  }
  return tier.fee;
}

/**
 * Calculates the discount amount for a given promo code type/value against
 * a subtotal. Does NOT validate whether the code is active/expired/over its
 * usage limit — that's the caller's job (checking against the promo_codes
 * table); this function ONLY does the discount math once a valid code object
 * is passed in.
 *
 * @param {number} subtotal
 * @param {{type: 'percentage'|'fixed'|'free_delivery', value: number}|null} promoCode
 * @returns {number} Discount amount in dollars
 */
export function getDiscount(subtotal, promoCode) {
  if (!promoCode) return 0;

  if (promoCode.type === "percentage") {
    return subtotal * (promoCode.value / 100);
  }

  if (promoCode.type === "fixed") {
    return Math.min(promoCode.value, subtotal);
  }

  // free_delivery doesn't discount the subtotal — it zeroes the delivery fee,
  // handled inside getCartTotals() below
  return 0;
}

/**
 * The main cart totals calculator — combines subtotal, discount, delivery
 * fee, and GST into a single final total (TRD 13.1). Reads gstRate from the
 * settings cache internally, so callers (like CartSidebar.jsx) don't need
 * to fetch or pass it in themselves.
 *
 * @param {Array<{price: number, quantity: number}>} items - Cart line items
 * @param {number} deliveryFee - Already-calculated fee (e.g. from getDeliveryFee()),
 *   or 0 for pickup orders
 * @param {{type: string, value: number}|null} promoCode
 * @returns {{subtotal: number, discount: number, deliveryFee: number, gst: number, total: number}}
 */
export function getCartTotals(items, deliveryFee = 0, promoCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = getDiscount(subtotal, promoCode);

  // free_delivery promo zeroes the fee specifically in the final total math
  const appliedDeliveryFee = promoCode?.type === "free_delivery" ? 0 : deliveryFee;

  const gstRate = cachedSettings.gstRate;
  const gstBase = subtotal - discount + appliedDeliveryFee;
  const gst = gstBase * (gstRate / 100);

  const total = subtotal - discount + appliedDeliveryFee + gst;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    deliveryFee: Math.round(appliedDeliveryFee * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Formats a number as a CAD price string, e.g. 8 -> "$8.00", 9.5 -> "$9.50".
 * WHY this exists: CartSidebar.jsx imports and calls this directly on every
 * price shown in the UI — needed for that file to work as-is.
 */
export function formatPrice(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

// TODO (Day 6 / Phase 7 — Product Drops & Wholesale, per implementation-plan.md):
// export function getBundlePrice(totalCans, limitedCount, basePrice) { ... }
//   Deferred — bundle UI (/shop/bundle-4, /shop/bundle-6) doesn't exist yet.

// TODO (Day 6 — Wholesale, per PRD FR-13):
// export function getWholesalePricePerCan(quantity) { ... }
//   Deferred to when wholesale checkout logic is actually being built.