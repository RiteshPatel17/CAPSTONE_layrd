import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStripeCheckoutSession } from "../../../lib/stripe.js";


// Bypass RLS for backend operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const payload = await request.json();
    const {
      items, contactInfo, method, address, deliveryFee,
      selectedDate, selectedTime, paymentMethod, promoCode, notes, totals
    } = payload;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Create the order in Supabase
    // Note: We use service_role client if we had one to bypass RLS, but standard client works if RLS allows inserts.
    // Ensure RLS allows inserts into `orders` from anon or authenticated users.
    const orderData = {
      customer_name: contactInfo.name,
      customer_email: contactInfo.email,
      customer_phone: contactInfo.phone,
      fulfillment: method,
      delivery_address: address,
      delivery_fee: deliveryFee || 0,
      pickup_date: selectedDate,
      pickup_time: selectedTime,
      payment_method: paymentMethod,
      payment_status: 'Unpaid',
      subtotal: totals.subtotal,
      discount: totals.discount || 0,
      gst: totals.gst,
      total: totals.total,
      promo_code: promoCode ? promoCode.code : null,
      status: paymentMethod === 'stripe' ? 'Pending Payment' : 'New',
      notes: notes || null
    };

    // Note: To associate with a user, we should extract the user_id from the session, 
    // but for now we leave it null (guest checkout) or handle it client-side.
    // For robust server-side auth, we'd use supabase server client with cookies.

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Checkout] Order creation failed:", orderError);
      return NextResponse.json({ error: orderError?.message || orderError?.details || "Failed to create order" }, { status: 500 });
    }

    // 2. Create order items
    const orderItemsData = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      size: item.size || null,
      quantity: item.quantity,
      unit_price: item.price,
      sweetness: item.sweetness || null,
      flavour: item.name,
      category: item.category || 'cake',
      type: item.type || 'can'
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error("[Checkout] Order items creation failed:", itemsError);
      // We could rollback the order here, but for now just log it.
    }

    // 3. Handle Stripe Session
    if (paymentMethod === "stripe") {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const successUrl = `${baseUrl}/confirmation?order=${order.id}`;
      const cancelUrl = `${baseUrl}/checkout`;

      // Map cart items to Stripe line items
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.name,
            description: item.sweetness ? `Sweetness: ${item.sweetness}` : undefined,
          },
          unit_amount: Math.round(item.price * 100), // Stripe takes cents
        },
        quantity: item.quantity,
      }));

      // Add delivery fee as a line item if applicable
      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Delivery Fee',
            },
            unit_amount: Math.round(deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      // Note: Discount handling in Stripe is best done via Stripe Coupons.
      // For this implementation, if there is a discount, we might need a custom negative line item 
      // or to adjust unit prices. Since Stripe doesn't allow negative line items directly easily, 
      // we'll pass the exact totals if possible or just use a placeholder session.

      const session = await createStripeCheckoutSession({
        lineItems,
        successUrl,
        cancelUrl,
        customerEmail: contactInfo.email,
        metadata: { orderId: order.id, orderNumber: order.id }
      });

      // Update order with session ID
      if (session && session.id) {
        await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
      }

      return NextResponse.json({ url: session.url });
    }

    // Return success for non-stripe methods
    // Send order confirmation and notification for non-stripe orders immediately
    if (promoCode) {
      try {
        await fetch(`${process.env.PROMO_SERVICE_URL}/api/promo/increment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_SERVICE_KEY
          },
          body: JSON.stringify({ code: promoCode.code })
        });
      } catch (err) {
        console.error("[Checkout] Failed to increment promo usage:", err);
      }
    }

    fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
      body: JSON.stringify({
        to: contactInfo.email,
        orderNumber: order.id,
        items: items,
        total: totals.total,
        pickupDate: selectedDate,
        deliveryMethod: method
      })
    }).catch(err => console.error("[Checkout] Failed to call notifications-service (confirmation):", err));

    fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/new-order-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
      body: JSON.stringify({
        orderNumber: order.id,
        items: items,
        total: totals.total,
        customerEmail: contactInfo.email
      })
    }).catch(err => console.error("[Checkout] Failed to call notifications-service (admin):", err));

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("[Checkout API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
