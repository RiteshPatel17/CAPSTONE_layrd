"use server";
// ─────────────────────────────────────────────
// LÄYRD – admin-products.js
// Server-side service layer for Products admin.
// Matches the REAL live Supabase schema (verified via information_schema):
//   id (text), category = 'cake'|'espresso'|'bundle', flavour_type = 'core'|'limited'
//   size = plain text (e.g. "250ml"), status = exact case, allergens = plain text
//   featured = boolean, max 4 featured at once
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "./supabase.js";

const MAX_FEATURED = 4;

function generateProductId(name) {
  const slug = (name || "product")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Date.now().toString(36).slice(-5);
  return `${slug}-${suffix}`;
}

export async function getProducts() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin Products] Error fetching products:", error);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    flavour: p.flavour,
    flavourType: p.flavour_type,
    size: p.size,
    price: parseFloat(p.price),
    description: p.description,
    ingredients: p.ingredients,
    allergens: p.allergens || "",
    status: p.status,
    releaseDate: p.release_date,
    image: p.image_url,
    featured: p.featured ?? false,
  }));
}

async function uploadImage(file) {
  if (!file) return null;
  const supabase = getSupabaseAdmin();
  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[Admin Products] Image upload failed:", uploadError);
    throw new Error(`Failed to upload product image: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(uploadData.path);
  return publicUrl;
}

async function getFeaturedCount(supabase, excludeId = null) {
  let query = supabase.from("products").select("id", { count: "exact", head: true }).eq("featured", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) {
    console.error("[Admin Products] Error counting featured products:", error);
    return 0;
  }
  return count ?? 0;
}

export async function createProduct(product) {
  const supabase = getSupabaseAdmin();

  if (product.featured) {
    const count = await getFeaturedCount(supabase);
    if (count >= MAX_FEATURED) {
      throw new Error(`Only ${MAX_FEATURED} products can be featured on the homepage at once. Unfeature one first.`);
    }
  }

  const newProduct = {
    id: generateProductId(product.name),
    name: product.name,
    category: product.category,
    flavour: product.flavour || product.name,
    flavour_type: product.flavourType,
    size: product.size,
    price: parseFloat(product.price),
    status: product.status,
    description: product.description || null,
    ingredients: product.ingredients || null,
    allergens: product.allergens || null,
    featured: !!product.featured,
    release_date: product.status === "Coming Soon" && product.releaseDate ? product.releaseDate : null,
  };

  if (product.image instanceof File) {
    newProduct.image_url = await uploadImage(product.image);
  } else if (typeof product.image === "string" && product.image.trim()) {
    newProduct.image_url = product.image;
  }

  const { data, error } = await supabase.from("products").insert(newProduct).select().single();
  if (error) {
    console.error("[Admin Products] Error creating product:", error);
    throw new Error(`Failed to create product: ${error.message}`);
  }
  return data;
}

export async function updateProduct(id, updates) {
  const supabase = getSupabaseAdmin();
  const dbUpdates = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.flavour !== undefined) dbUpdates.flavour = updates.flavour;
  if (updates.flavourType !== undefined) dbUpdates.flavour_type = updates.flavourType;
  if (updates.size !== undefined) dbUpdates.size = updates.size;
  if (updates.price !== undefined) dbUpdates.price = parseFloat(updates.price);
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;
  if (updates.allergens !== undefined) dbUpdates.allergens = updates.allergens;
  if (updates.releaseDate !== undefined) dbUpdates.release_date = updates.releaseDate || null;

  if (updates.featured !== undefined) {
    if (updates.featured === true) {
      const count = await getFeaturedCount(supabase, id);
      if (count >= MAX_FEATURED) {
        throw new Error(`Only ${MAX_FEATURED} products can be featured on the homepage at once. Unfeature one first.`);
      }
    }
    dbUpdates.featured = updates.featured;
  }

  if (updates.image instanceof File) {
    dbUpdates.image_url = await uploadImage(updates.image);
  } else if (typeof updates.image === "string" && updates.image.trim()) {
    dbUpdates.image_url = updates.image;
  }

  const { data, error } = await supabase.from("products").update(dbUpdates).eq("id", id).select().single();
  if (error) {
    console.error("[Admin Products] Error updating product:", error);
    throw new Error(`Failed to update product: ${error.message}`);
  }
  return data;
}

export async function toggleFeatured(id, featured) {
  return updateProduct(id, { featured });
}

export async function deleteProduct(id) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[Admin Products] Error deleting product:", error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}