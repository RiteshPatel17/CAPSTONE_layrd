import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { verifyStripeWebhook } from "../../../lib/stripe.js";
import { notifyAsync } from "../../../lib/notify.js";


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
      const eventInquiryId = session.metadata?.eventInquiryId;

      if (eventInquiryId) {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: existingInquiry } = await supabaseAdmin
          .from("event_inquiries")
          .select("deposit_paid, customer_id, event_type, event_date, deposit_amount, core_cans, limited_cans")
          .eq("id", eventInquiryId)
          .single();

        if (existingInquiry && existingInquiry.deposit_paid) {
          console.log(`[Stripe Webhook] Event inquiry ${eventInquiryId} deposit already recorded. Ignoring duplicate webhook.`);
          return NextResponse.json({ received: true });
        }

        const { error } = await supabaseAdmin
          .from("event_inquiries")
          .update({ deposit_paid: true })
          .eq("id", eventInquiryId);

        if (error) {
          console.error("[Stripe Webhook] Failed to mark event deposit paid:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        // Now that the deposit is actually paid, tell admin about the booking.
        if (existingInquiry?.customer_id) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(existingInquiry.customer_id);
          const customerEmail = userData?.user?.email;

          if (customerEmail) {
            notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/event-inquiry`, {
              inquiryId: eventInquiryId,
              customerName: userData.user.user_metadata?.full_name || customerEmail,
              eventDate: existingInquiry.event_date,
              canCount: (existingInquiry.core_cans || 0) + (existingInquiry.limited_cans || 0),
              depositAmount: existingInquiry.deposit_amount,
            }, { label: "Webhook: event-inquiry" });
          } else {
            console.error("[Stripe Webhook] Could not resolve customer email for event inquiry", eventInquiryId);
          }
        }

        return NextResponse.json({ received: true });
      }

      if (orderId) {
        // Fetch order details first to check idempotency
        const supabaseAdmin = getSupabaseAdmin();
        const { data: existingOrder } = await supabaseAdmin
          .from("orders")
          .select("payment_status")
          .eq("id", orderId)
          .single();

        if (existingOrder && existingOrder.payment_status === "Paid") {
          console.log(`[Stripe Webhook] Order ${orderId} is already paid. Ignoring duplicate webhook.`);
          return NextResponse.json({ received: true });
        }

        // Mark the order as Paid
        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "Paid",
            status: "Paid",
          })
          .eq("id", orderId);

        if (error) {
          console.error("[Stripe Webhook] Failed to update order status:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        // Fetch order details for emails
        const { data: orderData } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        const { data: orderItems } = await supabaseAdmin
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (orderData && orderItems) {
          if (orderData.promo_code) {
             try {
               const res = await fetch(`${process.env.PROMO_SERVICE_URL}/api/promo/increment`, {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   'x-internal-key': process.env.INTERNAL_SERVICE_KEY
                 },
                 body: JSON.stringify({ code: orderData.promo_code })
               });
               if (!res.ok) {
                 console.error("[Stripe Webhook] Fetch failed with status:", res.status, await res.text());
               } else {
                 console.log("[Stripe Webhook] Successfully incremented promo usage.");
               }
             } catch (err) {
               console.error("[Stripe Webhook] Failed to increment promo usage:", err);
             }
          }

          // Send Order Confirmation via Microservice
          notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/order-confirmation`, {
            to: orderData.customer_email,
            orderNumber: orderData.id,
            items: orderItems,
            total: orderData.total,
            pickupDate: orderData.pickup_date,
            deliveryMethod: orderData.fulfillment
          }, { label: "Webhook: order-confirmation" });

          // Send Admin Notification via Microservice
          notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/new-order-admin`, {
            orderNumber: orderData.id,
            items: orderItems,
            total: orderData.total,
            customerEmail: orderData.customer_email
          }, { label: "Webhook: new-order-admin" });
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
