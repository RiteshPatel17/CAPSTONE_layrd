// src/lib/stripe.js
//
// WHY this file exists (per TRD 4.3 service layer pattern): all Stripe SDK
// calls live here, not scattered across API routes. If Stripe's API version
// changes or we need to swap something, this is the ONE file to touch.
//
// WHY getStripe() is a function, not a top-level client: this file gets
// imported by API routes (server-only), and we want the Stripe client
// created lazily/fresh rather than as a module-level singleton that could
// behave oddly with Next.js's server component caching in some edge cases.
// It's cheap to construct, so this is safe.

import Stripe from "stripe";

/**
 * Returns a configured Stripe server-side client.
 * WHY this must NEVER be imported into a client component: STRIPE_SECRET_KEY
 * has full account access — it must only run in API routes / server code.
 */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia", // pinned to current API version (was outdated 2024-06-20, causing a startup warning)
  });
}

/**
 * Creates a Stripe Checkout Session — the hosted payment page Stripe
 * provides. Customer gets redirected to session.url to actually pay.
 *
 * @param {Array<{name: string, price: number, quantity: number}>} lineItems
 * @param {string} successUrl - Where Stripe redirects after successful payment
 * @param {string} cancelUrl - Where Stripe redirects if customer cancels
 * @param {string} customerEmail
 * @param {object} metadata - Arbitrary key-value data attached to the
 *   session, retrievable later in the webhook (e.g. our internal orderId)
 * @returns {Promise<{id: string, url: string}>}
 */
export async function createStripeCheckoutSession({
  lineItems,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata,
}) {
  const stripe = getStripe();

  // WHY we convert our lineItems shape into Stripe's price_data format here
  // (rather than requiring callers to know Stripe's exact schema): keeps
  // the calling code (checkout_sessions/route.js) simpler and decoupled
  // from Stripe's specific API shape.
  const stripeLineItems = lineItems.map((item) => ({
    price_data: {
      currency: "cad",
      product_data: {
        name: item.name,
      },
      // WHY Math.round(price * 100): Stripe expects amounts in the
      // smallest currency unit (cents for CAD), and floating point math
      // on dollar amounts can produce e.g. 799.9999999 instead of 800.
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    line_items: stripeLineItems,
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata, // e.g. { orderId: "ORD-2026-001" } — read back in the webhook
  });

  return { id: session.id, url: session.url };
}

/**
 * Verifies a Stripe webhook's signature and parses the event.
 * WHY this MUST use the raw request body (not JSON.parse'd): Stripe signs
 * the exact raw bytes sent — if Next.js's body parser touches the payload
 * first, the signature won't match and this will throw, even for
 * legitimate webhook calls. The webhook route.js must read the body as
 * raw text, not JSON, and pass that raw text here unmodified.
 *
 * @param {string} payload - Raw request body as a string
 * @param {string} signature - Value of the 'stripe-signature' request header
 * @returns {Stripe.Event} The verified, parsed Stripe event
 * @throws if signature verification fails (payload tampered with, or
 *   wrong webhook secret configured)
 */
export function verifyStripeWebhook(payload, signature) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}