"use server";
// ─────────────────────────────────────────────
// LÄYRD – contact-messages.js
// Server-side service layer for contact form submissions.
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "./supabase.js";

export async function getContactMessages() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Contact Messages] Error fetching:", error.message);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
  return data || [];
}

export async function markAsRead(id, isRead) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("contact_messages")
    .update({ is_read: isRead })
    .eq("id", id);

  if (error) {
    console.error("[Contact Messages] Error updating:", error.message);
    throw new Error(`Failed to update message: ${error.message}`);
  }
}