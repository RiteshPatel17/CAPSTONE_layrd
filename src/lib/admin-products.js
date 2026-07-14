// ─────────────────────────────────────────────
// LÄYRD – admin-products.js
// Service layer for Products admin.
// Uses Supabase for CRUD operations.
// ─────────────────────────────────────────────
import { supabase } from "./supabase.js";
import { mapProduct } from "./product-mapper.js";

/**
 * Get all products.
 */
export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("[Admin Products] Error fetching products:", error);
    throw new Error("API or logic missing: Supabase products query failed");
  }
  
  if (!data || data.length === 0) {
    // Fallback: If DB is empty, return one mock product for testing as requested
    return [{
      id: "mock-product-1",
      flavourId: "mock-product-1",
      name: "MOCK PRODUCT",
      flavour: "Mock Flavour",
      category: "core",
      dbCategory: "cake",
      size: "250ml",
      price: 8,
      status: "Available",
      description: "This is a mock product generated because the database currently has no products.",
      ingredients: "Mock ingredients",
      allergens: ["None"],
      image: null,
      releaseDate: null,
    }];
  }

  // Use the same mapper we use on the frontend, or simple mapping
  // We'll map slightly to match what admin expects
  return data.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category, // cake / espresso
    flavour: p.flavour_id, // we'll use flavour_id for flavour
    flavourType: p.category === 'cake' ? p.category : 'core', // simplified
    size: p.size_ml ? `${p.size_ml}ml` : "250ml",
    price: parseFloat(p.price),
    description: p.description,
    ingredients: p.ingredients,
    allergens: p.allergens ? p.allergens.join(", ") : "",
    status: p.status === 'sold_out' ? 'Sold Out' : p.status === 'coming_soon' ? 'Coming Soon' : p.status === 'hidden' ? 'Hidden' : 'Available',
    releaseDate: p.drop_date,
    image: p.image_url,
  }));
}

/**
 * Helper to upload image via API
 */
async function uploadImage(file) {
  if (!file) return null;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/admin/upload-product-image", {
    method: "POST",
    body: formData,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to upload image");
  return data.url;
}

/**
 * Create a new product.
 */
export async function createProduct(product) {
  // Map admin object to DB shape
  const newProduct = {
    name: product.name,
    flavour_id: product.flavour || product.name,
    size_ml: parseInt(product.size) || 250,
    category: product.category === 'espresso' ? 'espresso' : 'cake',
    price: parseFloat(product.price),
    status: product.status === 'Sold Out' ? 'sold_out' : product.status === 'Coming Soon' ? 'coming_soon' : product.status === 'Hidden' ? 'hidden' : 'available',
    description: product.description,
    ingredients: product.ingredients,
    allergens: product.allergens ? product.allergens.split(',').map(s => s.trim()) : [],
  };

  if (product.image instanceof File) {
    newProduct.image_url = await uploadImage(product.image);
  } else if (typeof product.image === 'string' && product.image.trim()) {
    newProduct.image_url = product.image;
  }

  const { data, error } = await supabase.from('products').insert(newProduct).select().single();
  if (error) {
    console.error("[Admin Products] Error creating product:", error);
    throw new Error("API or logic missing: Failed to create product in Supabase");
  }
  return data;
}

/**
 * Update an existing product by id.
 */
export async function updateProduct(id, updates) {
  // Try to map fields correctly
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.flavour !== undefined) dbUpdates.flavour_id = updates.flavour;
  if (updates.price !== undefined) dbUpdates.price = parseFloat(updates.price);
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status === 'Sold Out' ? 'sold_out' : updates.status === 'Coming Soon' ? 'coming_soon' : updates.status === 'Hidden' ? 'hidden' : 'available';
  }
  
  if (updates.image instanceof File) {
    dbUpdates.image_url = await uploadImage(updates.image);
  } else if (typeof updates.image === 'string' && updates.image.trim()) {
    dbUpdates.image_url = updates.image;
  }

  const { data, error } = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
  if (error) {
    console.error("[Admin Products] Error updating product:", error);
    throw new Error("API or logic missing: Failed to update product in Supabase");
  }
  return data;
}

/**
 * Delete a product by id.
 */
export async function deleteProduct(id) {
  // if it's the mock product, just ignore
  if (id === 'mock-product-1') return;

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error("[Admin Products] Error deleting product:", error);
    throw new Error("API or logic missing: Failed to delete product from Supabase");
  }
}

// Product field options
export const PRODUCT_CATEGORIES = ["cake", "espresso", "bundle"];
export const FLAVOUR_TYPES = ["core", "limited"];
export const PRODUCT_SIZES = ["150ml", "250ml", "330ml"];
export const PRODUCT_STATUSES = ["Available", "Sold Out", "Coming Soon", "Hidden"];
