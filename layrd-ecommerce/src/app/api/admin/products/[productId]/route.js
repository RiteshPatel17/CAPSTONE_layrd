// src/app/api/admin/products/[productId]/route.js
//
// WHY a separate dynamic route file: updateProduct() and deleteProduct()
// both need a specific product ID (from the URL), not just a body payload
// — same pattern as /api/admin/orders/[orderId].

import { updateProduct, deleteProduct } from "@/lib/admin-products";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request, { params }) {
  const { productId } = await params;
  const body = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const product = await updateProduct(supabaseAdmin, productId, body);
    return Response.json({ product });
  } catch (err) {
    console.error(`/api/admin/products/${productId} PATCH failed:`, err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { productId } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  try {
    await deleteProduct(supabaseAdmin, productId);
    return Response.json({ success: true });
  } catch (err) {
    console.error(`/api/admin/products/${productId} DELETE failed:`, err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}