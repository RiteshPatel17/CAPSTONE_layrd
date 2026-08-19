// src/lib/admin-inventory.js
//
// WHY calculateStock() now calls a Postgres RPC instead of merging JS
// arrays: we already built get_stock_summary() as a real SQL function on
// Day 1 (backend-schema.md) — it does the exact same produced-minus-
// committed calculation, but runs server-side in the database, which is
// both more efficient and avoids duplicating the merge/threshold logic in
// two places (SQL and JS) that could drift out of sync.

import { getSupabaseAdmin } from "@/lib/supabase";

// Low stock thresholds — kept here since get_stock_summary() has its own
// hardcoded thresholds baked into the SQL function itself (Out/Low/OK),
// these JS constants are no longer the source of truth but kept for any
// UI code that might still reference them for display purposes.
export const STOCK_THRESHOLD_LOW = 5;
export const STOCK_THRESHOLD_OUT = 0;

export const BATCH_FLAVOURS = [
  "Lotus Cheesecake",
  "Oreo Cheesecake",
  "Classic Tiramisu",
  "Bueno Cheesecake",
  "Matcha Cheesecake",
  "Pistachio Tiramisu",
];
export const BATCH_SIZES = ["150ml", "250ml", "330ml"];
export const BATCH_CATEGORIES = ["cake", "espresso"];

/**
 * Get all batches, most recent bake date first.
 */
export async function getBatches() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("*")
    .order("bake_date", { ascending: false });

  if (error) {
    console.error("admin-inventory.js: getBatches failed:", error.message);
    return [];
  }

  // WHY we map snake_case -> camelCase here: admin/inventory/page.jsx
  // was built against the old mock shape (qtyProduced, bakeDate, etc.)
  return data.map((b) => ({
    id: b.id,
    flavour: b.flavour,
    size: b.size,
    category: b.category,
    qtyProduced: b.qty_produced,
    bakeDate: b.bake_date,
    expiryDate: b.expiry_date,
    notes: b.notes,
    createdAt: b.created_at,
  }));
}

/**
 * Create a new production batch.
 */
export async function createBatch(batch) {
  const supabase = getSupabaseAdmin();

  // WHY a manually generated id (batch-YYYYMMDD-XXX-ish) rather than
  // leaving it to a DB default: backend-schema.md's inventory_batches.id
  // is a text PK with no auto-increment trigger defined (unlike orders,
  // which has generate_order_id()) — batches need an explicit id on insert.
  const id = `batch-${Date.now()}`;

  const { data, error } = await supabase
    .from("inventory_batches")
    .insert({
      id,
      flavour: batch.flavour,
      size: batch.size,
      category: batch.category,
      qty_produced: batch.qtyProduced,
      bake_date: batch.bakeDate,
      expiry_date: batch.expiryDate,
      notes: batch.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("admin-inventory.js: createBatch failed:", error.message);
    throw new Error("Failed to create batch");
  }

  return data;
}

/**
 * Update a batch by id.
 */
export async function updateBatch(id, updates) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("inventory_batches")
    .update({
      flavour: updates.flavour,
      size: updates.size,
      category: updates.category,
      qty_produced: updates.qtyProduced,
      bake_date: updates.bakeDate,
      expiry_date: updates.expiryDate,
      notes: updates.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("admin-inventory.js: updateBatch failed:", error.message);
    throw new Error("Failed to update batch");
  }

  return data;
}

/**
 * Delete a batch by id.
 */
export async function deleteBatch(id) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("inventory_batches").delete().eq("id", id);

  if (error) {
    console.error("admin-inventory.js: deleteBatch failed:", error.message);
    throw new Error("Failed to delete batch");
  }
}

/**
 * Calculate stock via the get_stock_summary() Postgres RPC (built Day 1).
 * WHY this ignores the batches/orderItems params it used to take: the old
 * mock version computed this in JS from two separate arrays — the RPC does
 * the equivalent join/aggregation server-side, so we don't need to pass
 * anything in anymore. Kept as a no-arg function so the calling page only
 * needs a small update (no longer needs to fetch batches/items separately
 * just to calculate stock).
 */
export async function calculateStock() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("get_stock_summary");

  if (error) {
    console.error("admin-inventory.js: calculateStock (RPC) failed:", error.message);
    return [];
  }

  // WHY we map snake_case -> camelCase + status casing here: the RPC
  // returns total_produced/committed/available/status(lowercase-ish) per
  // backend-schema.md's function definition - matching the old mock shape
  // (totalProduced, committed, available, status: "OK"/"Low"/"Out").
  return data.map((row) => ({
    flavour: row.flavour,
    size: row.size,
    category: row.category,
    totalProduced: row.total_produced,
    committed: row.committed,
    available: row.available,
    status: row.status, // RPC already returns 'Out'/'Low'/'OK' per backend-schema.md
  }));
}