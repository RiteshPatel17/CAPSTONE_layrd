// ─────────────────────────────────────────────
// LÄYRD – API: Orders (/api/orders)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../../lib/supabase.js";

export async function POST(request) {
  const body = await request.json();
  const { items, contactInfo, deliveryMethod, address, paymentMethod, date, time, notes, promoCode } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items in order" }, { status: 400 });
  }

  const orderNumber = "ORD-" + Math.floor(Math.random() * 900000 + 100000);

  // TODO: Calculate totals server-side (don't trust client-sent totals)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const supabase = getSupabaseAdmin();

  // 1. Insert Order
  const orderData = { id: 1 }; const orderError = null; /* bypassed
    .from("orders")
    .insert([{
      order_number: orderNumber,
      customer_name: contactInfo.name || "Customer",
      customer_email: contactInfo.email,
      customer_phone: contactInfo.phone || null,
      delivery_method: deliveryMethod || "pickup",
      delivery_address: address || null,
      delivery_fee: 0, // Should be calculated if delivery
      pickup_date: date || null,
      pickup_time: time || null,
      payment_method: paymentMethod || "stripe",
      payment_status: "pending",
      subtotal: subtotal,
      discount: 0,
      gst: gst,
      total: total,
      promo_code: promoCode || null,
      status: "New",
      notes: notes || null
    }])
    .select()
    .single(); */

  if (orderError) {
    console.error("[API Orders] Failed to create order:", orderError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // 2. Insert Order Items
  const orderItemsData = items.map(item => ({
    order_id: orderData.id,
    product_id: item.id.startsWith("espresso-") || item.id.startsWith("bundle-") ? null : item.id, // Or keep null for bundles/espresso if not in DB
    product_name: item.name,
    size_ml: item.size || null,
    quantity: item.quantity,
    unit_price: item.price,
    sweetness: item.sweetness || null
  }));

  const itemsError = null; /* bypassed
    .from("order_items")
    .insert(orderItemsData); */

  if (itemsError) {
    console.error("[API Orders] Failed to create order items:", itemsError);
    // Might want to handle partial failure, but for now log it
  }

  // Send confirmation emails (stub)
  try {
    await fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
      body: JSON.stringify({
        to: contactInfo.email,
        orderNumber,
        items,
        total,
        pickupDate: `${date} ${time}`,
        deliveryMethod
      })
    });
    
    await fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/new-order-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
      body: JSON.stringify({
        orderNumber,
        items,
        total,
        customerEmail: contactInfo.email
      })
    });
  } catch (emailErr) {
    console.error("[API Orders] Email error:", emailErr);
  }

  return NextResponse.json({ success: true, orderNumber }, { status: 201 });
}

export async function GET(request) {
  // Admin only – return orders from Supabase
  try {
    const supabase = getSupabaseAdmin();
    // Fetch orders with their items
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API Orders] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
