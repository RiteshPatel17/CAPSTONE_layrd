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
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  if (category === "bundle") {
    let bundles = BUNDLE_PRODUCTS;
    if (status) bundles = bundles.filter((p) => p.status === status);
    return NextResponse.json(bundles);
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("products").select("*").order("created_at", { ascending: true });

    if (category) {
      const dbFilter = categoryToDbFilter(category);
      if (dbFilter) {
        query = query.eq(dbFilter.column, dbFilter.value);
      }
    }

    if (status) {
      query = query.eq("status", statusToDb(status));
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API Products] Supabase query error:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const products = mapProducts(data);
    return NextResponse.json(products);

  } catch (error) {
    console.error("[API Products] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}