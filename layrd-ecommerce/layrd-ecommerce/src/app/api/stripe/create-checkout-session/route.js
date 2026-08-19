// src/app/api/stripe/create-checkout-session/route.js
//
// WHY the order is created HERE, before Stripe: per TRD 8.1's documented
// flow, the webhook UPDATES an existing order's status to 'Paid' — it
// doesn't create the order. Creating the order first also avoids Stripe's
// 500-char-per-metadata-value limit, which would break trying to pass an
// entire cart through metadata. We only need to pass the order ID.

import { createOrder, validateOrderInput } from "@/lib/orders";
import { createStripeCheckoutSession } from "@/lib/stripe";

export async function POST(request) {
  const body = await request.json();

  // WHY force paymentMethod to "stripe" here rather than trusting the
  // client: this route should ONLY ever create stripe-flow orders. If
  // someone calls this endpoint with paymentMethod: "cash" for some reason,
  // we don't want a cash order accidentally going through Stripe session
  // creation logic.
  const orderInput = { ...body, paymentMethod: "stripe" };

  const validationError = validateOrderInput(orderInput);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { order, error } = await createOrder(orderInput);

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  // WHY build success/cancel URLs from the request's own origin: this
  // makes the route work correctly whether we're on localhost:3000 during
  // dev or the real Vercel domain in production, without hardcoding either.
  const origin = new URL(request.url).origin;

 try {
    // WHY we build lineItems from the CART items plus separate GST and
    // delivery fee lines, rather than just the cart items alone: Stripe
    // only charges exactly what's listed as line items on the checkout
    // page. Our server-calculated order.total (via getCartTotals) already
    // includes GST and delivery fee — if we don't ALSO list them as their
    // own Stripe line items, Stripe would charge less than what we
    // recorded as the order total in Supabase, undercharging the customer.
    const lineItems = body.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    if (order.gst > 0) {
      lineItems.push({ name: "GST (5%)", price: order.gst, quantity: 1 });
    }
    if (order.delivery_fee > 0) {
      lineItems.push({ name: "Delivery Fee", price: order.delivery_fee, quantity: 1 });
    }
    if (order.discount > 0) {
      // WHY a negative-price line item for discounts: Stripe doesn't have
      // a built-in "coupon deducted" line concept in this simple flow, but
      // it DOES accept negative unit_amount values, which render as a
      // deduction on the checkout page (e.g. "Promo: -$5.00").
      lineItems.push({ name: `Promo (${order.promo_code || "discount"})`, price: -order.discount, quantity: 1 });
    }

    const session = await createStripeCheckoutSession({
      lineItems,
      successUrl: `${origin}/confirmation?order=${order.id}`,
      cancelUrl: `${origin}/checkout`,
      customerEmail: body.contactInfo.email,
      metadata: { orderId: order.id },
    });

    return Response.json({ url: session.url, orderId: order.id });
  } catch (err) {
    // WHY we don't delete the order row on Stripe failure: the order
    // already exists with status 'New'/'Unpaid' — if Stripe session
    // creation fails, the order just sits unpaid, which is a safe state
    // (not charged, not fulfilled). Adam can manually clean up abandoned
    // 'New'/'Unpaid' orders later if needed; not deleting avoids risk of
    // deleting something that actually WAS charged in some edge case.
    console.error("/api/stripe/create-checkout-session: Stripe error:", err.message);
    return Response.json(
      { error: "Failed to start payment", orderId: order.id },
      { status: 500 }
    );
  }
}