// ─────────────────────────────────────────────
// LÄYRD – API: Products (/api/products)
// Fetches live products from Supabase
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { mapProducts, categoryToDbFilter, statusToDb } from "../../../lib/product-mapper.js";
import { BUNDLE_PRODUCTS } from "../../../data/seed-products.js"; // Bundles aren't in DB yet

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // 'core' | 'limited' | 'bundle' | 'espresso'
  const status = searchParams.get("status"); // 'available' | 'sold_out' | etc.

  // Bundles are hardcoded for now as they are structural products
  if (category === "bundle") {
    let bundles = BUNDLE_PRODUCTS;
    if (status) bundles = bundles.filter((p) => p.status === status);
    return NextResponse.json(bundles);
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("products").select("*").order("created_at", { ascending: true });

    // Apply category filter
    if (category) {
      const dbFilter = categoryToDbFilter(category);
      if (dbFilter) {
        query = query.eq(dbFilter.column, dbFilter.value);
      }
    }

    // Apply status filter
    if (status) {
      query = query.eq("status", statusToDb(status));
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API Products] Supabase query error:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // Map DB rows to frontend format
    let products = mapProducts(data);
    
    // Fallback: If DB is empty, return one mock product for testing as requested
    if (products.length === 0) {
      products = [{
        id: "mock-product-1",
        flavourId: "mock-product-1",
        name: "MOCK PRODUCT",
        flavour: "Mock Flavour",
        category: "core",
        dbCategory: "cake",
        size: 250,
        price: 8,
        status: "available",
        description: "This is a mock product generated because the database currently has no products.",
        ingredients: "Mock ingredients",
        allergens: ["None"],
        imageUrl: null,
        image: null,
        releaseDate: null,
        createdAt: new Date().toISOString()
      }];
    }

    return NextResponse.json(products);

  } catch (error) {
    console.error("[API Products] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
