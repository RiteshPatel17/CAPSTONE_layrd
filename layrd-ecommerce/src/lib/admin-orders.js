"use server";
// ─────────────────────────────────────────────
// LÄYRD – admin-orders.js
// Server-side service layer for Orders admin.
// Every function requires a valid admin access token as its first
// argument — see requireAdmin() in admin-server-auth.js for why.
//
// Field mapping notes:
//   The UI expects `delivery_method`, but the real DB column is
//   `fulfillment` — mapped here, not renamed in the database.
//   The UI expects `order_number`; there is no such column, but `id`
//   is already a human-readable order string (e.g. "ORD-2026-036"),
//   so we map order_number = id. The UI's "(Legacy)" fallback for
//   missing order_number will simply never trigger as a result.
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "./supabase";
import { requireAdmin } from "@/lib/admin-server-auth";

function dbToJs(row) {
  return {
    ...row,
    order_number: row.id,
    delivery_method: row.fulfillment,
  };
}

/**
 * Get all orders, newest first, with a per-order item count attached
 * (used by the CSV export's "Items" column).
 */
export async function getOrders(accessToken) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  // One extra query for item counts (grouped in JS) rather than N+1
  // per-order queries.
  const orderIds = data.map((o) => o.id);
  let countsByOrder = {};
  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id")
      .in("order_id", orderIds);
    if (!itemsError && items) {
      for (const item of items) {
        countsByOrder[item.order_id] = (countsByOrder[item.order_id] || 0) + 1;
      }
    }
  }

  return data.map((row) => ({
    ...dbToJs(row),
    items: countsByOrder[row.id] || 0,
  }));
}

/**
 * Get a single order with its line items.
 */
export async function getOrderWithItems(accessToken, id) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items(*)`)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching order:", error);
    return null;
  }

  // UI expects product_name/size_ml, real columns are name/size (text)
  const lineItems = (data.order_items || []).map((item) => ({
    ...item,
    product_name: item.name,
    size_ml: item.size ? parseInt(item.size) : null,
  }));

  return { ...dbToJs(data), lineItems };
}

// Advancing an order to any of these means fulfillment is underway or done —
// that should never happen on an order that hasn't actually been paid for
// (this is also how a manually-confirmed cash/e-transfer order gets marked
// paid), so payment_status is kept in sync with status here instead of
// requiring a second, separate manual update that's easy to forget.
const STATUSES_IMPLYING_PAID = ["Paid", "Preparing", "Ready for Pickup", "Out for Delivery", "Completed"];

/**
 * Update order status by id. Keeps payment_status in sync so the two
 * fields can't silently drift apart (e.g. status says "Paid" while
 * payment_status still says "Unpaid").
 */
export async function updateOrderStatus(accessToken, id, status) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const updates = { status };
  if (STATUSES_IMPLYING_PAID.includes(status)) {
    updates.payment_status = "Paid";
  } else if (status === "Refunded") {
    updates.payment_status = "Refunded";
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating order status:", error);
    return null;
  }
  return dbToJs(data);
}