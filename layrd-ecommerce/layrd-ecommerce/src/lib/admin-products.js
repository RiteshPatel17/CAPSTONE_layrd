import { supabase } from './supabase';

// WHY these constants live here: admin/products/page.jsx needs them to
// populate its dropdown selects. Values match the exact CHECK constraints
// defined on the products table in backend-schema.md — keeping them here
// (not hardcoded in the page) means if the DB constraint ever changes,
// there's one place to update.
export const PRODUCT_CATEGORIES = ["cake", "espresso", "bundle"];
export const FLAVOUR_TYPES = ["core", "limited"];
export const PRODUCT_SIZES = ["150ml", "250ml", "330ml", "60ml"];
export const PRODUCT_STATUSES = ["Available", "Coming Soon", "Sold Out", "Hidden"];
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
    .order('flavour_type', { ascending: true });

  if (error) {
    // We don't throw here — a broken product fetch shouldn't crash the
    // whole shop page. Log it, return an empty array, let the UI handle
    // "no products" gracefully.
    console.error('getProducts error:', error);
    return [];
  }

  return data;
}

// Fetch a single product by its slug/id (e.g. 'lotus-250').
// Used on product detail views.
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('getProductById error:', error);
    return null;
  }

  return data;
}

// --- ADMIN-ONLY FUNCTIONS BELOW ---
// These require the SERVICE ROLE client (bypasses RLS), because regular
// customers should never be able to create/edit/delete products — only
// Adam, through the admin panel, calling a server-side API route.
//
// IMPORTANT: these functions must ONLY ever be called from Next.js API
// routes (src/app/api/**/route.js), NEVER from a "use client" component.
// That's why they accept `supabaseAdmin` as a parameter instead of
// importing getSupabaseAdmin() directly here — it forces whoever calls
// these functions to explicitly pass in the admin client, making it
// obvious at the call site that this is a privileged, server-only action.

export async function createProduct(supabaseAdmin, productData) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(supabaseAdmin, id, updates) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(supabaseAdmin, id) {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}