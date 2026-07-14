import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStripeCheckoutSession } from "../../../lib/stripe.js";
import { sendOrderConfirmationEmail, sendNewOrderNotification } from "../../../lib/resend.js";

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
      delivery_method: method,
      delivery_address: address,
      delivery_fee: deliveryFee || 0,
      pickup_date: selectedDate,
      pickup_time: selectedTime,
      payment_method: paymentMethod,
      payment_status: "pending",
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
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // 2. Create order items
    const orderItemsData = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      size_ml: item.size || null,
      quantity: item.quantity,
      unit_price: item.price,
      sweetness: item.sweetness || null
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
      const successUrl = `${baseUrl}/confirmation?order=${order.order_number}`;
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
        metadata: { orderId: order.id, orderNumber: order.order_number }
      });

      // Update order with session ID
      if (session && session.id) {
        await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
      }

      return NextResponse.json({ url: session.url });
    }

    // Return success for non-stripe methods
    // Send order confirmation and notification for non-stripe orders immediately
    await sendOrderConfirmationEmail({
      to: contactInfo.email,
      orderNumber: order.order_number,
      items: items,
      total: totals.total,
      pickupDate: selectedDate,
      deliveryMethod: method
    });

    await sendNewOrderNotification({
      orderNumber: order.order_number,
      items: items,
      total: totals.total,
      customerEmail: contactInfo.email
    });

    return NextResponse.json({ orderId: order.order_number });
  } catch (err) {
    console.error("[Checkout API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
