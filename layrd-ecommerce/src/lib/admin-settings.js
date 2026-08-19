"use server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-server-auth";
import { dbToJs, jsToDb, DEFAULT_SETTINGS } from "@/lib/settings-helpers";

export async function getSettings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("[Settings] Error fetching settings:", error.message);
    return DEFAULT_SETTINGS;
  }
  return dbToJs(data) || DEFAULT_SETTINGS;
}

export async function updateSettings(accessToken, updates) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const supabase = getSupabaseAdmin();
  const dbUpdates = jsToDb(updates);
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("settings")
    .upsert({ id: 1, ...dbUpdates })
    .select()
    .single();

  if (error) {
    console.error("[Settings] Error updating settings:", error.message);
    throw error;
  }
  return dbToJs(data);
}