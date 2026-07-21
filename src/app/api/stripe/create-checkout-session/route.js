// ─────────────────────────────────────────────
// LÄYRD – API: Stripe Checkout Session
// (/api/stripe/create-checkout-session)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { createStripeCheckoutSession } from "../../../../lib/stripe.js";

export async function POST(request) {
  const body = await request.json();
  const { items, customerEmail, orderId, successUrl, cancelUrl } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  try {
    // Build Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "cad",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.quantity,
    }));

    const session = await createStripeCheckoutSession({
      lineItems,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/confirmation?order=${orderId}`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      customerEmail,
      metadata: { orderId },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
