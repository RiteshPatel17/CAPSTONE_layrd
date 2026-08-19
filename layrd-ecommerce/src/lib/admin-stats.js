"use server";
// ─────────────────────────────────────────────
// LÄYRD – admin-stats.js
// Server-side count helpers for the admin dashboard.
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "./supabase.js";

export async function getEventInquiriesCount() {
  try {
    const supabase = getSupabaseAdmin();
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
    const supabase = getSupabaseAdmin();
    // Covers both the old status system (Pending) and the new one (New) —
    // wholesale_applications.status was migrated to accept both during
    // the transition period, and new submissions default to "New".
    const { count, error } = await supabase
      .from("wholesale_applications")
      .select("*", { count: "exact", head: true })
      .in("status", ["Pending", "New"]);

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