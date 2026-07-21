import { supabase } from "./supabase.js";

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

export async function createFaq(faq) {
  const { data, error } = await supabase
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

export async function updateFaq(id, updates) {
  const { data, error } = await supabase
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

export async function deleteFaq(id) {
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("[Admin FAQ] Error deleting FAQ:", error);
    throw error;
  }
  return true;
}
