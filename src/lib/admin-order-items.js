"use server";
// ─────────────────────────────────────────────
// LÄYRD – admin-order-items.js
// Server-side service layer for order line items.
// Used to calculate committed inventory stock.
// Every function requires a valid admin access token as its first
// argument — see requireAdmin() in admin-server-auth.js for why.
//
// Stock calculation rule:
//   COMMITTED statuses = New | Paid | Pending Payment | Preparing |
//                        Ready for Pickup | Out for Delivery | Completed
//   NOT committed = Cancelled | Refunded
//   NOT committed = Event inquiries (until Adam approves them)
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-server-auth";
import { COMMITTED_STATUSES } from "./order-items-options.js";

// ── Field mapping ────────────────────────────
// Maps a raw DB row (joined with orders) into the shape
// that calculateStock() in admin-inventory.js expects.
// Real schema: name, flavour, size (already plain text e.g. "250ml"),
// category, unit_price — no product_name or size_ml columns exist.

function dbToJs(row) {
  return {
    id:          row.id,
    orderId:     row.order_id,
    flavour:     row.flavour || row.name,
    size:        row.size || null,
    category:    row.category || "cake",
    quantity:    row.quantity,
    orderStatus: row.orders?.status ?? null,
    productName: row.name,
    unitPrice:   row.unit_price,
    sweetness:   row.sweetness ?? null,
  };
}

// ── Queries ───────────────────────────────────

export async function getOrderItems(accessToken) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
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
export async function getCommittedItems(accessToken) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
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

export async function getItemsForOrder(accessToken, orderId) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
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