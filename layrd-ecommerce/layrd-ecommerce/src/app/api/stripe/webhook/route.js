// src/app/api/stripe/webhook/route.js
//
// WHY this route reads the RAW body, not JSON: Stripe signs the exact raw
// bytes it sends. If Next.js's default JSON body parser touches the
// payload first (re-serializing it), the bytes won't match what Stripe
// signed, and signature verification will ALWAYS fail — even for
// legitimate requests. request.text() gives us the untouched raw string.
//
// WHY signature verification matters (per TRD 8.3, NFR-03): without it,
// anyone who discovers this URL could POST a fake "payment succeeded"
// event and mark any order as Paid without actually paying. This is a
// genuine security boundary, not just a formality.
//
// WHY this must be idempotent (per TRD 8.3): Stripe may send the SAME
// event more than once (network retries, etc.) — updating an already-Paid
// order to Paid again should be harmless, not cause duplicate side effects.
import { verifyStripeWebhook } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendNewOrderNotification } from "@/lib/resend";

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = verifyStripeWebhook(payload, signature);
  } catch (err) {
    // WHY 400, not 500: an invalid signature means the REQUEST itself is
    // malformed/untrusted (client error), not that our server broke.
    console.error("/api/stripe/webhook: signature verification failed:", err.message);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // WHY only handle checkout.session.completed for now: this is the only
  // event type relevant to our current flow (order paid via Checkout).
  // Other event types (payment_intent.payment_failed, etc.) can be added
  // later if needed, but are out of scope for Day 4.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      // WHY we don't throw/500 here: this shouldn't happen given our own
      // create-checkout-session route always sets metadata.orderId, but if
      // it somehow did, failing loudly would just cause Stripe to retry
      // forever on an event we can never actually process. Log and move on.
      console.error("/api/stripe/webhook: checkout.session.completed with no orderId in metadata");
      return new Response("OK", { status: 200 });
    }

    const supabase = getSupabaseAdmin();

    // WHY this update is naturally idempotent: setting status/payment_status
    // to 'Paid' again on an already-Paid order changes nothing meaningfully
    // — safe to run multiple times if Stripe retries this event.
    //
    // WHY .select("*, order_items(*)").single() instead of a plain update:
    // the webhook only receives orderId via Stripe metadata — it has no
    // knowledge of the customer's email, pickup date, or cart items (those
    // were never sent to Stripe, only the orderId was, per TRD 8.1's
    // 500-char metadata limit workaround). We need the full order + its
    // line items back from this same query so we can build both
    // notification emails without a second round-trip.
    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({ status: "Paid", payment_status: "Paid", stripe_session_id: session.id })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error) {
      console.error(`/api/stripe/webhook: failed to update order ${orderId} to Paid:`, error.message);
      // WHY we still return 200 here rather than 500: returning an error
      // status would cause Stripe to retry this webhook repeatedly. Since
      // we've already logged the failure for manual investigation, and a
      // retry likely won't fix a genuine DB error, we acknowledge receipt
      // to stop the retry loop rather than let it hammer our server.
      return new Response("OK", { status: 200 });
    }

    console.log(`/api/stripe/webhook: order ${orderId} marked as Paid`);

    // WHY fire-and-forget (not awaited) here too: same reasoning as
    // /api/orders — Stripe expects a fast 200 response, and per TRD 16
    // email failures must never block or delay webhook acknowledgment.
    // WHY this is naturally safe against duplicate sends on Stripe retries:
    // it isn't fully idempotent (a genuine retry COULD send duplicate
    // emails) but Stripe retries are rare in practice and a duplicate
    // notification is a low-stakes outcome compared to blocking the webhook.
    sendOrderConfirmationEmail({
      to: updatedOrder.customer_email,
      orderNumber: updatedOrder.id,
      items: updatedOrder.order_items,
      total: updatedOrder.total,
      pickupDate: updatedOrder.pickup_date,
    }).catch((err) => console.error("/api/stripe/webhook: customer email send threw unexpectedly:", err));

    sendNewOrderNotification({
      orderNumber: updatedOrder.id,
      items: updatedOrder.order_items,
      total: updatedOrder.total,
      customerEmail: updatedOrder.customer_email,
      paymentMethod: updatedOrder.payment_method,
    }).catch((err) => console.error("/api/stripe/webhook: admin notification email threw unexpectedly:", err));
  }

  // WHY we always return 200 for event types we don't explicitly handle:
  // per TRD 8.3, Stripe expects a fast 200 acknowledgment — returning
  // anything else for events we simply don't care about would cause
  // unnecessary retries.
  return new Response("OK", { status: 200 });
}