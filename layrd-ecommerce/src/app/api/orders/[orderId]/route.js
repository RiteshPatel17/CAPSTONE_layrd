// src/app/api/orders/[orderId]/route.js
//
// WHY this route exists (uses admin client, bypassing RLS): guest checkout
// orders have customer_id = null, so no RLS policy (which checks
// auth.uid() = customer_id) would ever let the public anon key read them
// back. This route deliberately looks up a SINGLE order by its specific ID
// only — it never lists/enumerates orders — so exposure is limited to
// "if you know the exact order ID, you can see its confirmation details,"
// which matches how order confirmation pages commonly work (the order ID
// itself acts as a lookup key, similar to a tracking number).

import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request, { params }) {
  const { orderId } = await params;

  if (!orderId) {
    return Response.json({ error: "Missing order ID" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json({ order });
}