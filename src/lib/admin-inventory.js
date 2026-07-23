"use server";
// ─────────────────────────────────────────────
// LÄYRD – admin-inventory.js
// Server-side service layer for production batches.
// Every function requires a valid admin access token as its first
// argument — see requireAdmin() in admin-server-auth.js for why.
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-server-auth";
import { getCommittedItems } from "@/lib/admin-order-items";
import { calculateStock } from "@/lib/inventory-options";

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

export async function getBatches(accessToken) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
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

export async function createBatch(accessToken, batch) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("inventory_batches")
    .insert(jsToDb(batch))
    .select()
    .single();

  if (error) {
    console.error("[Inventory] Error creating batch:", error.message);
    throw new Error(`Failed to create batch: ${error.message}`);
  }
  return dbToJs(data);
}

export async function updateBatch(accessToken, id, updates) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("inventory_batches")
    .update(jsToDb(updates))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Inventory] Error updating batch:", error.message);
    throw new Error(`Failed to update batch: ${error.message}`);
  }
  return dbToJs(data);
}

export async function deleteBatch(accessToken, id) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("inventory_batches")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Inventory] Error deleting batch:", error.message);
    throw new Error(`Failed to delete batch: ${error.message}`);
  }
  return true;
}

export async function getCurrentStock(accessToken) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const [batches, orderItems] = await Promise.all([
    getBatches(accessToken),
    getCommittedItems(accessToken),
  ]);
  return calculateStock(batches, orderItems);
}