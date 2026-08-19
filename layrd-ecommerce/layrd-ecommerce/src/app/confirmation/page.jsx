"use client";
// ─────────────────────────────────────────────
// LÄYRD – Order Confirmation page (/confirmation)
// ─────────────────────────────────────────────
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Snowflake } from "lucide-react";  // storage reminder icon
import { BRAND } from "../../lib/constants.js";
import { formatPrice } from "../../lib/pricing.js";
import { useCart } from "../../components/cart/CartContext.jsx";

function ConfirmationContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const { clearCart } = useCart();

  // WHY fetch real order data instead of just trusting the URL param:
  // the URL param only tells us the order NUMBER — actually showing real
  // items, total, and pickup details requires querying Supabase via our
  // /api/orders/[orderId] route (which bypasses RLS safely, scoped to a
  // single known order ID — see that route's comments for why this is safe).
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        console.error("Failed to load order:", err.message);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderNumber]);

  // WHY we clear the cart HERE rather than in checkout/page.jsx's Stripe
  // branch: clearing the cart before redirecting to Stripe would empty it
  // even if the customer cancels or abandons the Stripe-hosted checkout
  // page — a bad experience for an order that was never actually paid.
  // This confirmation page is only reached via Stripe's success_url AFTER
  // a real successful payment, so it's the correct, safe place to clear.
  // For cash/e-transfer orders, checkout/page.jsx already cleared the cart
  // before redirecting here — calling clearCart() again on an already-empty
  // cart is harmless, so this one useEffect safely covers both payment paths.
  // WHY a separate useEffect from the order-fetching one above: cart
  // clearing shouldn't depend on whether the order-detail FETCH succeeds or
  // fails — per this page's own "always show a confirmation, never a broken
  // page" philosophy, a customer who paid should get their cart cleared
  // even if the detail fetch has a hiccup.
  useEffect(() => {
    if (orderNumber) {
      clearCart();
    }
  }, [orderNumber]);

  // WHY we still show a confirmation UI even if fetch fails/no orderNumber:
  // per NFR-06 philosophy applied here too — a customer who just paid
  // should NEVER see a broken/blank page. If we can't load the details,
  // we fall back to a generic "thank you" without item specifics, rather
  // than showing an error screen right after someone paid real money.

  if (loading) {
    return <div className="section" style={{ textAlign: "center" }}>Loading your order...</div>;
  }

  return (
    <div className="section" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      {/* Success icon */}
      <div
        style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", margin: "0 auto 28px",
        }}
      >
        ✓
      </div>

      <span className="badge badge-green" style={{ marginBottom: "20px" }}>Order Confirmed</span>

      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "16px" }}>
        Thank you!
      </h1>

      <p style={{ fontSize: "1rem", marginBottom: "8px" }}>
        Your order <strong style={{ color: "var(--accent)" }}>{orderNumber || "has been placed"}</strong>{orderNumber ? " has been placed." : ""}
      </p>
      <p style={{ fontSize: "0.9rem", marginBottom: "40px" }}>
        A confirmation email will be sent to you shortly. LÄYRD will contact you if any details need clarification.
      </p>

      {/* Real order details — only shown if we successfully fetched them */}
      {order && !fetchError && (
        <div
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border-soft)",
            borderRadius: "4px", padding: "24px", marginBottom: "32px", textAlign: "left",
          }}
        >
          <h5 style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px" }}>
            Order Summary
          </h5>

          {order.order_items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)" }}>{item.name} × {item.quantity}</span>
              <span style={{ color: "var(--text-main)" }}>{formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          ))}

          <div className="divider" style={{ margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 600, marginBottom: "12px"}}>
            <span>Total</span>
            <span style={{ color: "var(--accent)" }}>{formatPrice(order.total)}</span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {order.fulfillment === "pickup" ? "Pickup" : "Delivery"} · {order.pickup_date} at {order.pickup_time}
          </p>
        </div>
      )}

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px", textAlign: "left" }}>
        {[
          {
            title: "Pickup Location",
            content: `${BRAND.pickupArea}\nExact address in your confirmation email.`,
          },
          {
            title: "Need Help?",
            content: `Email: ${BRAND.email}\nPhone: ${BRAND.phone}`,
          },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: "4px", padding: "20px",
            }}
          >
            <h5 style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
              {card.title}
            </h5>
            {card.content.split("\n").map((line, i) => (
              <p key={i} style={{ fontSize: "0.875rem", color: "var(--text-main)", marginBottom: "4px" }}>{line}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Storage reminder — Snowflake lucide icon (professional, no emoji) */}
      <div
        style={{
          background: "rgba(184,155,94,0.06)", border: "1px solid rgba(184,155,94,0.18)",
          borderRadius: "4px", padding: "14px 18px", marginBottom: "40px",
          fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "left",
          display: "flex", alignItems: "flex-start", gap: "10px",
        }}
      >
        <Snowflake size={16} strokeWidth={1.5} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
        <span><strong style={{ color: "var(--text-main)" }}>Storage Reminder:</strong> Keep refrigerated. Sealed: 3–5 days. Opened: 24–48 hours.</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/shop">
          <button className="btn btn-primary">Shop Again</button>
        </Link>
        <Link href="/">
          <button className="btn btn-outline">Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="section" style={{ textAlign: "center" }}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}