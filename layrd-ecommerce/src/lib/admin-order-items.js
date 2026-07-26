// src/lib/admin-order-items.js
//
// WHY this file now queries Supabase directly instead of using mock data:
// per backend-schema.md, we already have a `committed_order_items` VIEW
// that does the Cancelled/Refunded filtering at the DATABASE level — no
// need to reimplement that filtering logic in JS anymore.

import { getSupabaseAdmin } from "@/lib/supabase";

// Kept for reference/backward compatibility — the real filtering now
// happens via the committed_order_items SQL view (backend-schema.md),
// not via this JS constant, but other files may still reference it.
export const COMMITTED_STATUSES = [
  "New",
  "Paid",
  "Pending Payment",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
];
export const EXCLUDED_STATUSES = ["Cancelled", "Refunded"];

/**
 * Get all order items, each annotated with its parent order's status.
 * WHY the join: admin-inventory.js's calculateStock() (next step) needs
 * to know each item's order status to decide what counts as committed.
 */
export async function getOrderItems() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_items")
    .select("*, orders(status)");

  if (error) {
    console.error("admin-order-items.js: getOrderItems failed:", error.message);
    return [];
  }

  // WHY we flatten orders.status onto each item here: the OLD mock shape
  // had orderStatus directly on each item object (not nested under a
  // separate `orders` key) — flattening keeps admin-inventory.js's
  // calculateStock() working without needing changes to ITS logic.
  return data.map((item) => ({
    id: item.id,
    orderId: item.order_id,
    flavour: item.flavour,
    size: item.size,
    category: item.category,
    quantity: item.quantity,
    orderStatus: item.orders?.status,
  }));
}

/**
 * Update all order_items belonging to an order to reflect a NEW order
 * status. WHY this exists even though order_items doesn't store its own
 * status column: kept for interface compatibility with the old mock
 * version — in the real schema, order_items.orders(status) already
 * reflects the CURRENT status via the join above (since it's the orders
 * table's status, not a copy). This function is now effectively a no-op
 * pass-through, since updateOrderStatus() in admin-orders.js is what
 * actually updates orders.status in Supabase.
 */
export function updateOrderItemsStatus(orderId, newStatus) {
  // Intentionally does nothing — order_items has no separate status field
  // to update. Status lives on the parent `orders` row only. Kept as a
  // no-op function so admin-orders.js's updateOrderStatus() can still call
  // it without needing to know this detail, in case it's useful later
  // (e.g. logging).
}

/**
 * Get only COMMITTED order items — i.e. those counted against available
 * stock. Uses the committed_order_items SQL VIEW (backend-schema.md),
 * which already excludes Cancelled/Refunded orders at the database level.
 */
export async function getCommittedItems() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("committed_order_items")
    .select("*");

  if (error) {
    console.error("admin-order-items.js: getCommittedItems failed:", error.message);
    return [];
  }

  return data;
}