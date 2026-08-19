// src/lib/orders.js
//
// WHY this shared function exists (per TRD 4.3 service layer pattern):
// Both /api/orders (cash/e-transfer orders, placed directly) and
// /api/stripe/create-checkout-session (stripe orders, need an order row
// BEFORE creating the Stripe session so the webhook has something to
// update) need to create an order the exact same way. Duplicating this
// logic in two route files risks them drifting out of sync — e.g. someone
// fixes a bug in one copy and forgets the other. This is the ONE place
// order-creation logic lives.

import { getSupabaseAdmin } from "@/lib/supabase";
import { getCartTotals } from "@/lib/pricing";

/**
 * Validates order input and returns an error message if invalid, or null
 * if everything looks good. Kept separate from createOrder() so callers
 * can validate BEFORE doing any other work (e.g. before even attempting
 * to talk to Stripe).
 */
export function validateOrderInput({
  items,
  contactInfo,
  fulfillment,
  paymentMethod,
  pickupDate,
  pickupTime,
  deliveryAddress,
}) {
  if (!items || items.length === 0) return "No items in order";
  if (!contactInfo?.name || !contactInfo?.email) return "Missing contact name or email";
  if (!fulfillment || !["pickup", "delivery"].includes(fulfillment)) return "Invalid fulfillment method";
  if (!paymentMethod || !["stripe", "etransfer", "cash"].includes(paymentMethod)) return "Invalid payment method";
  if (!pickupDate || !pickupTime) return "Missing pickup/delivery date or time";
  if (fulfillment === "delivery" && !deliveryAddress) return "Delivery address required for delivery orders";
  return null;
}

/**
 * Creates an order + its order_items in Supabase, with SERVER-SIDE
 * recalculated totals (per TRD 12 — never trust a client-sent total).
 *
 * WHY this does NOT call validateOrderInput() itself: callers should
 * validate first and handle the error response in their own way (different
 * routes may want different error formats) — this function assumes valid
 * input and focuses purely on the insert logic.
 *
 * @returns {Promise<{order: object, error: string|null}>}
 */
export async function createOrder({
  items,
  contactInfo,
  fulfillment,
  deliveryAddress,
  distanceKm,
  deliveryFee,
  paymentMethod,
  pickupDate,
  pickupTime,
  notes,
  promoCode,
}) {
  const appliedDeliveryFee = fulfillment === "pickup" ? 0 : (deliveryFee || 0);
  const totals = getCartTotals(items, appliedDeliveryFee, promoCode);

  // WHY per-method logic here (per project-brief.md section 7 + order
  // status lifecycle): each payment method has a DIFFERENT correct
  // starting status —
  //   stripe: 'New' / 'Unpaid' — webhook flips both to 'Paid' once Stripe
  //           confirms the charge succeeded
  //   etransfer: 'Pending Payment' / 'Pending Payment' — Adam manually
  //           confirms once he sees the e-transfer arrive
  //   cash: 'New' / 'Unpaid' — Adam marks Paid on pickup/delivery day
  const initialStatus = paymentMethod === "etransfer" ? "Pending Payment" : "New";
  const initialPaymentStatus = paymentMethod === "etransfer" ? "Pending Payment" : "Unpaid";

  const supabase = getSupabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: contactInfo.name,
      customer_email: contactInfo.email,
      customer_phone: contactInfo.phone || null,
      type: "regular",
      status: initialStatus,
      fulfillment,
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,
      subtotal: totals.subtotal,
      delivery_fee: totals.deliveryFee,
      discount: totals.discount,
      gst: totals.gst,
      total: totals.total,
      promo_code: promoCode?.code || null,
      delivery_address: fulfillment === "delivery" ? deliveryAddress : null,
      distance_km: fulfillment === "delivery" ? distanceKm : null,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      notes: notes || null,
    })
    .select()
    .single();

  if (orderError) {
    console.error("orders.js: failed to insert order:", orderError.message);
    return { order: null, error: "Failed to create order" };
  }

  const orderItemsToInsert = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId || item.id,
    name: item.name,
    flavour: item.flavour || item.name,
    size: item.size || "N/A",
    category: item.category || "cake",
    type: item.type || "can",
    quantity: item.quantity,
    unit_price: item.price,
    sweetness: item.sweetness || null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsError) {
    // WHY we don't roll back the order row: Supabase JS client doesn't
    // support multi-table transactions directly. Logged loudly here;
    // flagged as a known limitation (would need a Postgres RPC for true
    // atomicity, out of scope for this project's timeline).
    console.error("orders.js: order created but order_items failed:", itemsError.message);
    return { order, error: "Order created but failed to save items" };
  }

  return { order, error: null };
}