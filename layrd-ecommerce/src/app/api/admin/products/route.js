// src/app/api/admin/products/route.js
//
// WHY this route exists: createProduct() in admin-products.js requires
// getSupabaseAdmin() (service role key), which per TRD 7.1 must only run
// server-side. This bridges the "use client" admin/products/page.jsx to
// that service layer safely. getProducts() (GET) doesn't strictly need
// the service role — it uses the public RLS-respecting client — but we
// route through here too for consistency with the other admin pages'
// fetch-from-API pattern.
//
// TODO (Day 6, per TRD 20 known technical debt): add real admin role
// verification here before allowing writes — same known gap flagged in
// the other admin bridge routes, not fixed today.

import { getProducts, createProduct } from "@/lib/admin-products";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const products = await getProducts();
  return Response.json({ products });
}

export async function POST(request) {
  const body = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const product = await createProduct(supabaseAdmin, body);
    return Response.json({ product }, { status: 201 });
  } catch (err) {
    console.error("/api/admin/products POST failed:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}