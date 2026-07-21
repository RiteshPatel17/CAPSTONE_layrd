// ─────────────────────────────────────────────
// LÄYRD – admin-order-items.js
// Service layer for order line items.
// Used to calculate committed inventory stock.
//
// Phase 8: All queries now hit Supabase `order_items` table.
//
// Stock calculation rule:
//   COMMITTED statuses = New | Paid | Pending Payment | Preparing |
//                        Ready for Pickup | Out for Delivery | Completed
//   NOT committed = Cancelled | Refunded
//   NOT committed = Event inquiries (until Adam approves them)
// ─────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

// Statuses that commit (lock) inventory
export const COMMITTED_STATUSES = [
  "New",
  "Paid",
  "Pending Payment",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
];

// Statuses that free up inventory
export const EXCLUDED_STATUSES = ["Cancelled", "Refunded"];

// ── Field mapping ──────────────────────────────
// Maps a raw DB row (joined with orders) into the shape
// that calculateStock() in admin-inventory.js expects.

function dbToJs(row) {
  return {
    id:          row.id,
    orderId:     row.order_id,
    // flavour + category added in Phase 8 SQL migration (Option A)
    // Fall back to product_name if flavour column not yet populated
    flavour:     row.flavour || row.product_name,
    // size_ml is stored as integer (e.g. 250), calculateStock needs "250ml"
    size:        row.size_ml ? `${row.size_ml}ml` : null,
    category:    row.category || "cake",
    quantity:    row.quantity,
    // order status comes from the joined orders row
    orderStatus: row.orders?.status ?? null,
    // extra fields for display purposes
    productName: row.product_name,
    sizeMl:      row.size_ml,
    unitPrice:   row.unit_price,
    sweetness:   row.sweetness ?? null,
  };
}

// ── Queries ────────────────────────────────────

/**
 * Get all order items joined with their order's status.
 */
export async function getOrderItems() {
  const { data, error } = await supabase
    .from("order_items")
    .select("*, orders!inner(status)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[OrderItems] Error fetching order items:", error.message);
    return [];
  }
  return (data ?? []).map(dbToJs);
}

/**
 * Get committed order items (those that lock inventory stock).
 * Filters in JS after fetching — PostgREST joined-column filtering
 * can be unreliable across versions.
 */
export async function getCommittedItems() {
  const { data, error } = await supabase
    .from("order_items")
    .select("*, orders!inner(status)");

  if (error) {
    console.error("[OrderItems] Error fetching committed items:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => COMMITTED_STATUSES.includes(row.orders?.status))
    .map(dbToJs);
}

/**
 * Get all line items for a specific order.
 */
export async function getItemsForOrder(orderId) {
  const { data, error } = await supabase
    .from("order_items")
    .select("*, orders!inner(status)")
    .eq("order_id", orderId);

  if (error) {
    console.error("[OrderItems] Error fetching items for order:", error.message);
    return [];
  }
  return (data ?? []).map(dbToJs);
}
