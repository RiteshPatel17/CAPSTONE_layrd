// ─────────────────────────────────────────────
// LÄYRD – admin-inventory.js
// Service layer for production batches.
//
// KEY DESIGN:
//   Batches store only what was PRODUCED (qtyProduced).
//   Available stock = qtyProduced - committedQuantity (from orders).
//   Admin never manually enters "remaining" — it's always calculated.
//
// Phase 7: All CRUD now hits Supabase `inventory_batches` table.
// ─────────────────────────────────────────────
import { supabase } from "@/lib/supabase";
import { getCommittedItems, COMMITTED_STATUSES } from "@/lib/admin-order-items";

// Low stock thresholds
export const STOCK_THRESHOLD_LOW = 5;  // 1–5 = Low
export const STOCK_THRESHOLD_OUT = 0;  // 0   = Out

// Flavour and size options for forms
export const BATCH_FLAVOURS = [
  "Lotus Cheesecake",
  "Oreo Cheesecake",
  "Classic Tiramisu",
  "Bueno Cheesecake",
  "Matcha Cheesecake",
  "Pistachio Tiramisu",
];
export const BATCH_SIZES      = ["150ml", "250ml", "330ml"];
export const BATCH_CATEGORIES = ["cake", "espresso"];

// ── Field mapping helpers ──────────────────────
// DB uses snake_case; JS uses camelCase throughout the app.

function dbToJs(row) {
  return {
    id:          row.id,
    flavour:     row.flavour,
    size:        row.size,
    category:    row.category,
    qtyProduced: row.qty_produced,
    bakeDate:    row.bake_date,
    expiryDate:  row.expiry_date,
    notes:       row.notes ?? "",
    createdAt:   row.created_at,
  };
}

function jsToDb(batch) {
  return {
    flavour:      batch.flavour,
    size:         batch.size,
    category:     batch.category,
    qty_produced: Number(batch.qtyProduced),
    bake_date:    batch.bakeDate,
    expiry_date:  batch.expiryDate,
    notes:        batch.notes ?? "",
  };
}

// ── CRUD ──────────────────────────────────────

/**
 * Get all batches, ordered by bake date descending.
 */
export async function getBatches() {
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("*")
    .order("bake_date", { ascending: false });

  if (error) {
    console.error("[Inventory] Error fetching batches:", error.message);
    return [];
  }
  return (data ?? []).map(dbToJs);
}

/**
 * Create a new batch.
 */
export async function createBatch(batch) {
  const { data, error } = await supabase
    .from("inventory_batches")
    .insert(jsToDb(batch))
    .select()
    .single();

  if (error) {
    console.error("[Inventory] Error creating batch:", error.message);
    return null;
  }
  return dbToJs(data);
}

/**
 * Update a batch by id.
 */
export async function updateBatch(id, updates) {
  const { data, error } = await supabase
    .from("inventory_batches")
    .update(jsToDb(updates))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Inventory] Error updating batch:", error.message);
    return null;
  }
  return dbToJs(data);
}

/**
 * Delete a batch by id.
 */
export async function deleteBatch(id) {
  const { error } = await supabase
    .from("inventory_batches")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Inventory] Error deleting batch:", error.message);
    return false;
  }
  return true;
}

// ── Stock calculation ──────────────────────────

/**
 * Calculate available stock per flavour+size+category.
 *
 * availableStock = totalQtyProduced - totalCommittedQuantity
 *
 * Committed = order items with statuses: New, Paid, Pending Payment,
 *             Preparing, Ready for Pickup, Out for Delivery, Completed
 * NOT committed: Cancelled, Refunded
 * NOT committed: Event inquiries (until Adam approves them)
 *
 * NOTE: orderItems still uses mock data (Phase 8 will connect order_items to Supabase).
 *
 * @param {Array} batches    - from getBatches()
 * @param {Array} orderItems - from getCommittedItems()
 * @returns {Array} stockSummary
 */
export function calculateStock(batches, orderItems) {
  // Build a map of flavour+size+category → totalProduced
  const producedMap = {};
  for (const b of batches) {
    const key = `${b.flavour}||${b.size}||${b.category}`;
    producedMap[key] = (producedMap[key] || 0) + b.qtyProduced;
  }

  // Build a map of flavour+size+category → totalCommitted
  const committedMap = {};
  for (const item of orderItems) {
    const key = `${item.flavour}||${item.size}||${item.category}`;
    committedMap[key] = (committedMap[key] || 0) + item.quantity;
  }

  // Merge into summary rows
  const allKeys = new Set([...Object.keys(producedMap), ...Object.keys(committedMap)]);
  const summary = [];

  for (const key of allKeys) {
    const [flavour, size, category] = key.split("||");
    const totalProduced  = producedMap[key]  || 0;
    const committed      = committedMap[key] || 0;
    const available      = Math.max(0, totalProduced - committed);

    let status = "OK";
    if (available <= STOCK_THRESHOLD_OUT) status = "Out";
    else if (available <= STOCK_THRESHOLD_LOW) status = "Low";

    summary.push({ flavour, size, category, totalProduced, committed, available, status });
  }

  // Sort: Out → Low → OK, then by flavour
  return summary.sort((a, b) => {
    const order = { Out: 0, Low: 1, OK: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.flavour.localeCompare(b.flavour);
  });
}

/**
 * Convenience: calculate stock using live Supabase data.
 * NOTE: orderItems now uses real Supabase data (Phase 8 complete).
 */
export async function getCurrentStock() {
  const [batches, orderItems] = await Promise.all([
    getBatches(),
    getCommittedItems(),
  ]);
  return calculateStock(batches, orderItems);
}
