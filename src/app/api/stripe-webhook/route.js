import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";
import { verifyStripeWebhook } from "../../../lib/stripe.js";
import { sendOrderConfirmationEmail, sendNewOrderNotification } from "../../../lib/resend.js";

// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;

    try {
      event = verifyStripeWebhook(payload, signature);
    } catch (err) {
      console.error("[Stripe Webhook] Verification failed:", err);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // Mark the order as Paid
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "Paid",
          })
          .eq("id", orderId);

        if (error) {
          console.error("[Stripe Webhook] Failed to update order status:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        // Fetch order details for emails
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (orderData && orderItems) {
          await sendOrderConfirmationEmail({
            to: orderData.customer_email,
            orderNumber: orderData.order_number,
            items: orderItems,
            total: orderData.total,
            pickupDate: orderData.pickup_date,
            deliveryMethod: orderData.delivery_method
          });

          await sendNewOrderNotification({
            orderNumber: orderData.order_number,
            items: orderItems,
            total: orderData.total,
            customerEmail: orderData.customer_email
          });
        }
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
