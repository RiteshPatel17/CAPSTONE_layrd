// ─────────────────────────────────────────────
// LÄYRD – Admin Stats Helpers
// ─────────────────────────────────────────────
import { supabase } from "./supabase.js";

export async function getEventInquiriesCount() {
  try {
    // Count only pending inquiries
    const { count, error } = await supabase
      .from("event_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "Pending");

    if (error) {
      console.error("[Stats] Failed to fetch event inquiries count:", error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
}

export async function getWholesaleAppsCount() {
  try {
    // Count only pending applications
    const { count, error } = await supabase
      .from("wholesale_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "Pending");

    if (error) {
      console.error("[Stats] Failed to fetch wholesale apps count:", error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
}
