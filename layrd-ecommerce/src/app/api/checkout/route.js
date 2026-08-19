import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { createStripeCheckoutSession } from "../../../lib/stripe.js";
import { getSettings } from "../../../lib/admin-settings.js";
import { ESPRESSO_PRODUCTS, BUNDLE_PRODUCTS } from "../../../data/seed-products.js";
import { notifyAsync } from "../../../lib/notify.js";

const MAX_DELIVERY_FEE = 30; // matches the top DELIVERY_TIERS fee tier — a sanity cap, not a full re-validation

// Bundle cart items carry an id like "bundle-4-<flavour ids joined by ->", so
// composition can't be safely reconstructed (flavour ids can contain hyphens
// too). Instead we verify the submitted price is one of the finite legitimate
// values for that bundle size — basePrice + 0..canCount limited-flavour
// premiums — which fully closes the "set my own bundle price" gap without
// needing to decode which cans were picked.
function resolveBundlePrice(id, submittedPrice) {
  const canCount = parseInt(id.split("-")[1], 10);
  const bundle = BUNDLE_PRODUCTS.find((b) => b.canCount === canCount);
  if (!bundle) return null;

  for (let n = 0; n <= canCount; n++) {
    const candidate = bundle.basePrice + n * bundle.limitedPremium;
    if (Math.abs(candidate - Number(submittedPrice)) < 0.01) return candidate;
  }
  return null;
}

/**
 * Re-derives each cart item's price from the authoritative source (the
 * products table for real products, static definitions for espresso/bundle
 * pseudo-items) instead of trusting the client-submitted price. Returns
 * { items } with verified prices, or { error } if anything can't be verified.
 */
async function verifyItemPrices(supabaseAdmin, items) {
  const regularIds = items
    .map((i) => i.id)
    .filter((id) => typeof id === "string" && !id.startsWith("espresso-") && !id.startsWith("bundle-"));

  const priceById = new Map();
  if (regularIds.length > 0) {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, price")
      .in("id", regularIds);
    if (error) {
      console.error("[Checkout] Product price lookup failed:", error);
      return { error: "Failed to verify item prices." };
    }
    (products || []).forEach((p) => priceById.set(p.id, parseFloat(p.price)));
  }

  const verified = [];
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: `Invalid quantity for "${item.name || item.id}".` };
    }

    let verifiedPrice = null;
    if (priceById.has(item.id)) {
      verifiedPrice = priceById.get(item.id);
    } else if (typeof item.id === "string" && item.id.startsWith("espresso-")) {
      const match = ESPRESSO_PRODUCTS.find((e) => e.id === item.id);
      if (match) verifiedPrice = match.price;
    } else if (typeof item.id === "string" && item.id.startsWith("bundle-")) {
      verifiedPrice = resolveBundlePrice(item.id, item.price);
    }

    if (verifiedPrice === null || !Number.isFinite(verifiedPrice)) {
      return { error: `Could not verify the price for "${item.name || item.id}". Please refresh your cart and try again.` };
    }

    verified.push({ ...item, price: verifiedPrice });
  }

  return { items: verified };
}

/**
 * Re-validates a promo code entirely server-side (never trusts the
 * client-submitted discount/type/min-order values) — mirrors the fallback
 * logic in /api/promo, plus enforces min_order_amount, which nothing in
 * the system checked server-side before this.
 */
async function verifyPromoCode(supabaseAdmin, rawCode, subtotal) {
  if (!rawCode) return { promo: null };

  let { data: promo, error } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("code", rawCode)
    .single();

  if (error || !promo) {
    const upperCode = rawCode.toUpperCase();
    const { data: promoUpper, error: upperError } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", upperCode)
      .single();
    if (!upperError && promoUpper && !promoUpper.case_sensitive) {
      promo = promoUpper;
      error = null;
    }
  }

  if (error || !promo) return { error: "This promo code is no longer valid." };
  if (!promo.is_active) return { error: "This promo code is no longer active." };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { error: "This promo code has expired." };
  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) return { error: "This promo code has reached its usage limit." };
  if (promo.min_order_amount && subtotal < parseFloat(promo.min_order_amount)) {
    return { error: `This promo code requires a minimum order of $${parseFloat(promo.min_order_amount).toFixed(2)}.` };
  }

  return { promo };
}

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const {
      items, contactInfo, method, address, deliveryFee,
      selectedDate, selectedTime, paymentMethod, promoCode, notes
    } = payload;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Re-derive every price server-side — never trust client-submitted totals.
    const verification = await verifyItemPrices(supabaseAdmin, items);
    if (verification.error) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }
    const verifiedItems = verification.items;

    const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedDeliveryFee = Math.min(Math.max(Number(deliveryFee) || 0, 0), MAX_DELIVERY_FEE);

    let discount = 0;
    let deliveryFeeAfterPromo = appliedDeliveryFee;
    let verifiedPromoCode = null;

    if (promoCode?.code) {
      const promoResult = await verifyPromoCode(supabaseAdmin, promoCode.code, subtotal);
      if (promoResult.error) {
        return NextResponse.json({ error: promoResult.error }, { status: 400 });
      }
      if (promoResult.promo) {
        const promo = promoResult.promo;
        verifiedPromoCode = promo.code;
        if (promo.type === "percentage") {
          discount = subtotal * (parseFloat(promo.value) / 100);
        } else if (promo.type === "fixed") {
          discount = Math.min(parseFloat(promo.value), subtotal);
        } else if (promo.type === "free_delivery") {
          deliveryFeeAfterPromo = 0;
        }
      }
    }

    const settings = await getSettings();
    const gstRate = (settings.gstRate ?? 5) / 100;

    const discountedSubtotal = subtotal - discount;
    const gst = (discountedSubtotal + deliveryFeeAfterPromo) * gstRate;
    const total = discountedSubtotal + deliveryFeeAfterPromo + gst;

    // 2. Create the order in Supabase using the server-verified totals.
    const orderData = {
      user_id: user.id,
      customer_name: contactInfo.name,
      customer_email: contactInfo.email,
      customer_phone: contactInfo.phone,
      fulfillment: method,
      delivery_address: address,
      delivery_fee: deliveryFeeAfterPromo,
      pickup_date: selectedDate,
      pickup_time: selectedTime,
      payment_method: paymentMethod,
      payment_status: 'Unpaid',
      subtotal,
      discount,
      gst,
      total,
      promo_code: verifiedPromoCode,
      status: paymentMethod === 'stripe' ? 'Pending Payment' : 'New',
      notes: notes || null
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Checkout] Order creation failed:", orderError);
      return NextResponse.json({ error: orderError?.message || orderError?.details || "Failed to create order" }, { status: 500 });
    }

    // 3. Create order items
    // NOTE: product-mapper.js deliberately converts the DB's "250ml" text
    // into a plain number (250) for frontend convenience. If we stored that
    // raw number here, order_items.size would end up as "250" instead of
    // "250ml", breaking the flavour+size+category matching that
    // calculateStock() in admin-inventory.js relies on to compare against
    // inventory_batches (which always uses the full "250ml" format).
    // This normalizes any purely-numeric size back to the "Xml" format
    // before it's stored, regardless of whether it arrives as a number
    // (250) or an already-correct string ("250ml" or "150ml" for events).
    function normalizeSize(size) {
      if (size == null) return null;
      const str = String(size).trim();
      return /^\d+$/.test(str) ? `${str}ml` : str;
    }

    const orderItemsData = verifiedItems.map(item => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      size: normalizeSize(item.size),
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

    // 4. Handle Stripe Session
    if (paymentMethod === "stripe") {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const successUrl = `${baseUrl}/confirmation?order=${order.id}`;
      const cancelUrl = `${baseUrl}/checkout`;

      // A single consolidated line item equal to the server-verified total,
      // rather than one line item per cart item. Stripe Checkout can't take
      // a negative line item for the discount, and per-item proportional
      // scaling would just reintroduce rounding drift — this way the amount
      // Stripe actually charges is guaranteed to equal `order.total` exactly,
      // with no way for a client-tampered total to slip through.
      const lineItems = [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `LÄYRD Order — ${verifiedItems.length} item${verifiedItems.length !== 1 ? "s" : ""}`,
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }];

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
    if (verifiedPromoCode) {
      try {
        await fetch(`${process.env.PROMO_SERVICE_URL}/api/promo/increment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_SERVICE_KEY
          },
          body: JSON.stringify({ code: verifiedPromoCode })
        });
      } catch (err) {
        console.error("[Checkout] Failed to increment promo usage:", err);
      }
    }

    notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/order-confirmation`, {
      to: contactInfo.email,
      orderNumber: order.id,
      items: verifiedItems,
      total,
      pickupDate: selectedDate,
      deliveryMethod: method
    }, { label: "Checkout: order-confirmation" });

    notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/new-order-admin`, {
      orderNumber: order.id,
      items: verifiedItems,
      total,
      customerEmail: contactInfo.email
    }, { label: "Checkout: new-order-admin" });

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("[Checkout API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
