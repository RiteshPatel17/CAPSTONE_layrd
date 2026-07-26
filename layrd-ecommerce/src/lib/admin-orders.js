// src/lib/admin-orders.js
//
// WHY this maps Supabase's snake_case columns to the OLD mock's camelCase
// shape (customer, payment, items as a count, etc.): admin/orders/page.jsx
// was already built against that shape. Remapping data here means we don't
// need to touch the page component's JSX/rendering logic at all — only
// this service layer changes.

import { getSupabaseAdmin } from "@/lib/supabase";
import { updateOrderItemsStatus } from "@/lib/admin-order-items";

export const ORDER_STATUSES = [
  "New",
  "Paid",
  "Pending Payment",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
  "Cancelled",
  "Refunded",
];
export const ORDER_TYPES = ["regular", "event", "wholesale"];

/**
 * Maps a raw Supabase orders row (+ optional order_items count) into the
 * shape admin/orders/page.jsx expects.
 */
function mapOrder(row, itemCount) {
  return {
    id: row.id,
    customer: row.customer_name,
    email: row.customer_email,
    type: row.type,
    items: itemCount ?? 0,
    subtotal: Number(row.subtotal),
    gst: Number(row.gst),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    fulfillment: row.fulfillment,
    payment: row.payment_method,
    paymentStatus: row.payment_status,
    // WHY this date formatting: the old mock used "YYYY-MM-DD HH:MM" —
    // matching that format keeps the table column rendering unchanged.
    date: new Date(row.created_at).toISOString().slice(0, 16).replace("T", " "),
  };
}

/**
 * Get all orders, most recent first, each annotated with its item count.
 */
export async function getOrders() {
  const supabase = getSupabaseAdmin();

  // WHY select order_items(quantity) here: we need the count of items per
  // order for the table's "Items" column, without fetching full item
  // details (that only happens in getOrderWithItems, on demand).
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(quantity)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin-orders.js: getOrders failed:", error.message);
    return [];
  }

  return data.map((row) => {
    const itemCount = row.order_items.reduce((sum, i) => sum + i.quantity, 0);
    return mapOrder(row, itemCount);
  });
}

/**
 * Get a single order with its full line items (for the detail panel).
 */
export async function getOrderWithItems(id) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("admin-orders.js: getOrderWithItems failed:", error?.message);
    return null;
  }

  const itemCount = data.order_items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    ...mapOrder(data, itemCount),
    // WHY lineItems keeps its own shape (id, flavour, size, quantity):
    // matches what the detail panel in admin/orders/page.jsx already
    // renders (item.flavour, item.size, item.quantity).
    lineItems: data.order_items.map((item) => ({
      id: item.id,
      flavour: item.flavour,
      size: item.size,
      quantity: item.quantity,
    })),
  };
}

/**
 * Update order status by id. Real Supabase update — status lives ONLY on
 * the orders table (order_items has no separate status field, per the
 * real schema), so updateOrderItemsStatus() is now just a compatibility
 * no-op call (see admin-order-items.js).
 */
export async function updateOrderStatus(id, status) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("admin-orders.js: updateOrderStatus failed:", error.message);
    return null;
  }

  updateOrderItemsStatus(id, status); // compatibility no-op, see admin-order-items.js

  return mapOrder(data);
}