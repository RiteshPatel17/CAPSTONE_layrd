// ─────────────────────────────────────────────
// LÄYRD – Pricing utilities
// ─────────────────────────────────────────────
import { DELIVERY_TIERS, GST_RATE, WHOLESALE_TIERS } from "./constants.js";

/**
 * Calculate delivery fee based on distance in km
 * @param {number} distanceKm
 * @returns {number} fee in CAD
 */
export function getDeliveryFee(distanceKm) {
  const tier = DELIVERY_TIERS.find((t) => distanceKm <= t.maxKm);
  return tier ? tier.fee : 30;
}

/**
 * Calculate wholesale price per can based on quantity
 * @param {number} canCount
 * @returns {number} price per can
 */
export function getWholesalePricePerCan(canCount) {
  const tier = WHOLESALE_TIERS.find(
    (t) => canCount >= t.minCans && canCount <= t.maxCans
  );
  return tier ? tier.pricePerCan : null;
}

/**
 * Calculate wholesale order total
 * @param {number} canCount
 * @returns {{ pricePerCan: number, subtotal: number, gst: number, total: number } | null}
 */
export function getWholesaleTotal(canCount) {
  const pricePerCan = getWholesalePricePerCan(canCount);
  if (!pricePerCan) return null;
  const subtotal = pricePerCan * canCount;
  const gst = subtotal * GST_RATE;
  return {
    pricePerCan,
    subtotal,
    gst,
    total: subtotal + gst,
  };
}

/**
 * Calculate cart totals
 * @param {Array} items – cart items
 * @param {number} deliveryFee
 * @param {object|null} promoCode – { type: 'percentage'|'fixed'|'free_delivery', value: number }
 * @returns {{ subtotal, discount, deliveryFee, gst, total }}
 */
export function getCartTotals(items, deliveryFee = 0, promoCode = null) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discount = 0;
  let appliedDeliveryFee = deliveryFee;

  if (promoCode) {
    if (promoCode.type === "percentage") {
      discount = subtotal * (promoCode.value / 100);
    } else if (promoCode.type === "fixed") {
      discount = Math.min(promoCode.value, subtotal);
    } else if (promoCode.type === "free_delivery") {
      appliedDeliveryFee = 0;
    }
  }

  const discountedSubtotal = subtotal - discount;
  const gst = (discountedSubtotal + appliedDeliveryFee) * GST_RATE;
  const total = discountedSubtotal + appliedDeliveryFee + gst;

  return {
    subtotal,
    discount,
    deliveryFee: appliedDeliveryFee,
    gst,
    total,
  };
}

/**
 * Format a number as Canadian dollar string
 * @param {number} amount
 */
export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate bundle price (mix of core + limited cans)
 * @param {number} totalCans
 * @param {number} limitedCount – number of limited flavour cans in the bundle
 * @param {number} basePrice – bundle base price (all core)
 */
export function getBundlePrice(totalCans, limitedCount, basePrice) {
  return basePrice + limitedCount;
}
