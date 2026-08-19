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

  if (!stripe) {
    throw new Error("Stripe is not configured (missing or invalid STRIPE_SECRET_KEY).");
  }

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
}

export function verifyStripeWebhook(payload, signature) {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook is not configured (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET).");
  }
  try {
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET.trim());
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`);
  }
}
