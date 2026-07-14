// ─────────────────────────────────────────────
// LÄYRD – admin-orders.js
// Service layer for Orders admin.
// Queries Supabase directly.
// ─────────────────────────────────────────────
import { supabase } from "./supabase";
import { ORDER_STATUSES } from "./constants";

/**
 * Get all orders.
 */
export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data;
}

/**
 * Get a single order with its line items.
 */
export async function getOrderWithItems(id) {
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items(*)`)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching order:", error);
    return null;
  }
  
  // Format for backward compatibility if needed, or just return as is.
  return { ...data, lineItems: data.order_items || [] };
}

/**
 * Update order status by id.
 */
export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating order status:", error);
    return null;
  }
  return data;
}

export { ORDER_STATUSES };
export const ORDER_TYPES = ["regular", "event", "wholesale"];
