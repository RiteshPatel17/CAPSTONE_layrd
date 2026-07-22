// ─────────────────────────────────────────────
// LÄYRD – Stripe client
// ─────────────────────────────────────────────

let stripeClient = null;

export function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require('stripe');
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' }); // latest supported version standard
    } catch (e) {
      console.warn("Stripe module not installed or invalid key.");
    }
  }
  return stripeClient;
}

export async function createStripeCheckoutSession({ lineItems, successUrl, cancelUrl, customerEmail, metadata }) {
  const stripe = getStripe();

  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: metadata
      });
      return session;
    } catch (err) {
      console.error("Stripe Checkout Error:", err);
      // Fallback if API fails
    }
  }

  // Mock response fallback if no key or stripe module is missing
  return {
    id: "cs_mock_" + Date.now(),
    url: successUrl,
  };
}

export function verifyStripeWebhook(payload, signature) {
  const stripe = getStripe();
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET.trim());
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
  // Mock response
  return { type: "checkout.session.completed", data: { object: { metadata: {} } } };
}
