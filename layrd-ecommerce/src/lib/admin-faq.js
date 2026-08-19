import { supabase, getSupabaseAdmin } from "./supabase.js";
import { requireAdmin } from "./admin-server-auth.js";

export async function getFaqs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error("[Admin FAQ] Error fetching FAQs:", error.message || error);
    throw new Error(error.message || "Failed to fetch FAQs");
  }
  
  return data || [];
}

export async function createFaq(accessToken, faq) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await getSupabaseAdmin()
    .from('faqs')
    .insert([{
      category: faq.category || 'General',
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order || 0,
      is_published: faq.is_published !== undefined ? faq.is_published : true
    }])
    .select()
    .single();

  if (error) {
    console.error("[Admin FAQ] Error creating FAQ:", error.message || error);
    throw new Error(error.message || "Failed to create FAQ");
  }
  return data;
}

export async function updateFaq(accessToken, id, updates) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await getSupabaseAdmin()
    .from('faqs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("[Admin FAQ] Error updating FAQ:", error.message || error);
    throw new Error(error.message || "Failed to update FAQ");
  }
  return data;
}

export async function deleteFaq(accessToken, id) {
  const admin = await requireAdmin(accessToken);
  if (!admin) throw new Error("Unauthorized");

  const { error } = await getSupabaseAdmin()
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("[Admin FAQ] Error deleting FAQ:", error);
    throw error;
  }
  return true;
}
