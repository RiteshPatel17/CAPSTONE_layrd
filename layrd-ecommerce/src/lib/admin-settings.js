// ─────────────────────────────────────────────
// LÄYRD – admin-settings.js
// Service layer for Store Settings admin.
// WHY this now queries Supabase instead of an in-memory mock: per Day 5
// scope, this is the last piece of admin data still using MOCK_SETTINGS.
// settings is a SINGLE-ROW table (id always = 1, enforced by a CHECK
// constraint in backend-schema.md) — every read/write targets that one row.
// ─────────────────────────────────────────────

import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Maps a raw Supabase settings row (snake_case) into the camelCase shape
 * the admin UI uses. WHY: same reasoning as admin-orders.js/admin-inventory.js
 * — keeps the rest of the codebase's naming convention consistent even
 * though the DB columns are snake_case.
 */
function mapSettings(row) {
  return {
    storeEmail: row.store_email,
    storePhone: row.store_phone,
    socialHandle: row.social_handle,
    pickupArea: row.pickup_area,
    pickupAddress: row.pickup_address,
    gstRate: Number(row.gst_rate),
    deliveryEnabled: row.delivery_enabled,
    deliveryTiers: row.delivery_tiers,
  };
}

/**
 * Get the single settings row.
 */
export async function getSettings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("admin-settings.js: getSettings failed:", error.message);
    return null;
  }

  return mapSettings(data);
}

/**
 * Update settings (partial update supported).
 * WHY we map camelCase back to snake_case here: the admin UI/caller sends
 * updates in the camelCase shape (matching what getSettings() returns), but
 * the actual DB columns are snake_case — this is the one place that
 * translation happens, so callers never need to know the DB's real column
 * names.
 * WHY we only include keys that were actually passed: this supports
 * PARTIAL updates (e.g. just changing gstRate) without accidentally
 * overwriting other fields with undefined.
 */
export async function updateSettings(updates) {
  const supabase = getSupabaseAdmin();

  const dbUpdates = {};
  if (updates.storeEmail !== undefined) dbUpdates.store_email = updates.storeEmail;
  if (updates.storePhone !== undefined) dbUpdates.store_phone = updates.storePhone;
  if (updates.socialHandle !== undefined) dbUpdates.social_handle = updates.socialHandle;
  if (updates.pickupArea !== undefined) dbUpdates.pickup_area = updates.pickupArea;
  if (updates.pickupAddress !== undefined) dbUpdates.pickup_address = updates.pickupAddress;
  if (updates.gstRate !== undefined) dbUpdates.gst_rate = updates.gstRate;
  if (updates.deliveryEnabled !== undefined) dbUpdates.delivery_enabled = updates.deliveryEnabled;
  if (updates.deliveryTiers !== undefined) dbUpdates.delivery_tiers = updates.deliveryTiers;

  // WHY updated_at is set explicitly here rather than relying on a DB
  // default/trigger: backend-schema.md's settings table has no auto-update
  // trigger defined for this column, so we set it ourselves on every write.
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("settings")
    .update(dbUpdates)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    console.error("admin-settings.js: updateSettings failed:", error.message);
    throw new Error("Failed to update settings");
  }

  return mapSettings(data);
}