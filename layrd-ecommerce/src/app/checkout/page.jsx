"use client";
// ─────────────────────────────────────────────
// LÄYRD – Checkout page (/checkout)
// Delivery/pickup selection, date/time, payment
// ─────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { MapPin, Truck } from "lucide-react";  // icons for pickup/delivery cards
import { useCart } from "../../components/cart/CartContext.jsx";
import { formatPrice, getCartTotals, getDeliveryFee } from "../../lib/pricing.js";
import { PAYMENT_METHODS, DELIVERY_MIN_ITEMS, BRAND } from "../../lib/constants.js";

export default function CheckoutPage() {
  const { items, totalItems, promoCode, setDeliveryFee, setDeliveryMethod, deliveryFee, meetsDeliveryMinimum, clearCart } = useCart();
  const [method, setMethod] = useState("pickup"); // 'pickup' | 'delivery'
  const [address, setAddress] = useState("");
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  // Available time slots (mock – later from admin availability)
  const TIME_SLOTS = ["11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM", "7:00 PM"];

  async function handleCalculateDelivery() {
    if (!address.trim()) return;
    setCalculatingDistance(true);
    try {
      const res = await fetch(`/api/delivery-fee?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      setDistanceInfo(data);
      if (data.isWithinCalgary) {
        setDeliveryFee(data.fee);
        setDeliveryMethod("delivery");
      } else {
        setDistanceInfo({ ...data, outsideCalgary: true });
        setDeliveryFee(0);
      }
    } catch {
      // Fallback: mock calculation
      const mockKm = 8;
      const mockFee = getDeliveryFee(mockKm);
      setDistanceInfo({ distanceKm: mockKm, fee: mockFee, isMock: true, isWithinCalgary: true });
      setDeliveryFee(mockFee);
    } finally {
      setCalculatingDistance(false);
    }
  }

  const { discount, gst, total, subtotal } = getCartTotals(items, deliveryFee, promoCode);

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setPlacing(true);

    // WHY we build this shared payload once: both endpoints (/api/orders
    // and /api/stripe/create-checkout-session) expect the same shape of
    // data — validateOrderInput()/createOrder() in orders.js are shared
    // between them.
    const orderPayload = {
      items,
      contactInfo,
      fulfillment: method,
      deliveryAddress: method === "delivery" ? address : undefined,
      distanceKm: distanceInfo?.distanceKm,
      deliveryFee,
      paymentMethod,
      pickupDate: selectedDate,
      pickupTime: selectedTime,
      notes,
      promoCode,
    };

    try {
      if (paymentMethod === "stripe") {
        // WHY we redirect to Stripe's URL rather than handling payment
        // inline: Stripe Checkout is a HOSTED page (per TRD 8.1) — we never
        // collect card details ourselves, which keeps us out of PCI
        // compliance scope entirely.
        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to start payment");
        }

        window.location.href = data.url; // redirect to Stripe's hosted page
      } else {
        // Cash or e-transfer: no Stripe involved, order is created directly
        // and immediately confirmed (no external payment step to redirect to)
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to place order");
        }

        clearCart(); // empty the cart now that the order is successfully placed
        window.location.href = `/confirmation?order=${data.orderId}`;
      }
    } catch (err) {
      console.error("handlePlaceOrder failed:", err.message);
      alert("Something went wrong placing your order. Please try again."); // simple fallback for now — Day 8 polish could replace with a nicer inline error
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <h2 style={{ marginBottom: "20px" }}>Your cart is empty</h2>
          <Link href="/shop"><button className="btn btn-primary">Back to Shop</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "8px" }}>Checkout</h1>
        <div className="divider-accent" style={{ marginBottom: "40px" }} />

        <form onSubmit={handlePlaceOrder}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "48px", alignItems: "start" }}>
            {/* Left: form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

              {/* Contact */}
              <Section title="1. Contact Information">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Full Name" required>
                    <input className="input" required placeholder="Jane Doe" value={contactInfo.name}
                      onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <input className="input" type="email" required placeholder="jane@example.com" value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
                  </Field>
                </div>
                <Field label="Phone">
                  <input className="input" type="tel" placeholder="403-555-0000" value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} />
                </Field>
              </Section>

              {/* Pickup or Delivery */}
              <Section title="2. Pickup or Delivery">
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { value: "pickup",   Icon: MapPin, label: "Pickup",   sub: `${BRAND.pickupArea}` },
                    { value: "delivery", Icon: Truck,  label: "Delivery", sub: `Min. ${DELIVERY_MIN_ITEMS} items` },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setMethod(opt.value);
                        if (opt.value === "pickup") {
                          setDeliveryFee(0);
                          setDeliveryMethod("pickup");
                        }
                      }}
                      style={{
                        flex: 1, padding: "16px",
                        border: `1px solid ${method === opt.value ? "#B89B5E" : "var(--border-soft)"}`,
                        background: method === opt.value ? "rgba(184,155,94,0.07)" : "var(--surface)",
                        color: "var(--text-main)", cursor: "pointer", borderRadius: "4px", textAlign: "left",
                        transition: "border-color 0.2s, background 0.2s",
                      }}
                    >
                      {/* lucide icon + label side by side */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, marginBottom: "4px" }}>
                        <opt.Icon size={18} strokeWidth={1.6} style={{ color: method === opt.value ? "var(--accent)" : "var(--text-muted)", flexShrink: 0 }} />
                        {opt.label}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", paddingLeft: "26px" }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>

                {method === "delivery" && (
                  <div>
                    {!meetsDeliveryMinimum && (
                      <p style={{ fontSize: "0.82rem", color: "var(--accent)", marginBottom: "12px" }}>
                        ⚠ Add {DELIVERY_MIN_ITEMS - totalItems} more item{DELIVERY_MIN_ITEMS - totalItems !== 1 ? "s" : ""} to enable delivery.
                      </p>
                    )}
                    <Field label="Delivery Address">
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input className="input" placeholder="123 Main St NE, Calgary, AB" value={address}
                          onChange={(e) => setAddress(e.target.value)} style={{ flex: 1 }} />
                        <button type="button" onClick={handleCalculateDelivery}
                          disabled={!address.trim() || calculatingDistance}
                          className="btn btn-outline btn-sm">
                          {calculatingDistance ? "..." : "Check"}
                        </button>
                      </div>
                    </Field>

                    {distanceInfo && (
                      <div
                        style={{
                          marginTop: "12px", padding: "12px 16px", borderRadius: "3px",
                          background: distanceInfo.outsideCalgary ? "rgba(239,68,68,0.08)" : "rgba(201,169,110,0.07)",
                          border: `1px solid ${distanceInfo.outsideCalgary ? "rgba(239,68,68,0.2)" : "rgba(201,169,110,0.2)"}`,
                          fontSize: "0.875rem",
                        }}
                      >
                        {distanceInfo.outsideCalgary ? (
                          <p style={{ color: "#f87171" }}>Outside Calgary — pickup only.</p>
                        ) : (
                          <p style={{ color: "var(--accent)" }}>
                            ~{distanceInfo.distanceKm} km away · Delivery fee: {formatPrice(distanceInfo.fee)}
                            {distanceInfo.isMock && " (estimated)"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Section>

              {/* Date & Time */}
              <Section title="3. Pickup / Delivery Date & Time">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Date">
                    <input className="input" type="date" required value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)} />
                  </Field>
                  <Field label="Time Slot">
                    <select className="input" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} required>
                      <option value="">Select a time</option>
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  Available slots are set by LÄYRD. Time is approximate.
                </p>
              </Section>

              {/* Payment */}
              <Section title="4. Payment Method">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      style={{
                        padding: "14px 18px",
                        border: `1px solid ${paymentMethod === pm.id ? "var(--accent)" : "var(--border-soft)"}`,
                        background: paymentMethod === pm.id ? "var(--surface-active)" : "var(--surface)",
                        color: "var(--text-main)", cursor: "pointer", borderRadius: "3px",
                        textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "border-color 0.2s, background 0.2s",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: "2px" }}>{pm.label}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{pm.subtitle}</div>
                      </div>
                      {paymentMethod === pm.id && (
                        <span style={{ color: "var(--accent)", fontSize: "1.1rem" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Notes */}
              <Section title="5. Order Notes (Optional)">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Any special requests or notes for your order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </Section>
            </div>

            {/* Right: order summary */}
            <div
              style={{
                background: "var(--surface)", border: "1px solid var(--border-soft)",
                borderRadius: "4px", padding: "28px",
                position: "sticky", top: "calc(var(--nav-height) + 24px)",
              }}
            >
              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", marginBottom: "20px" }}>
                Order Summary
              </h4>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>{item.name} × {item.quantity}</span>
                    <span style={{ color: "var(--text-main)" }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="divider" style={{ margin: "0 0 12px" }} />

              {/* Totals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                <SumRow label="Subtotal" value={formatPrice(subtotal)} />
                {discount > 0 && <SumRow label="Promo" value={`-${formatPrice(discount)}`} green />}
                <SumRow label="Delivery" value={method === "pickup" ? "Pickup" : deliveryFee > 0 ? formatPrice(deliveryFee) : "TBD"} />
                <SumRow label="GST (5%)" value={formatPrice(gst)} />
              </div>

              <div className="divider" style={{ margin: "0 0 16px" }} />

              <SumRow label="Total" value={formatPrice(total)} bold />

              {/* Place order */}
              <button
                type="submit"
                disabled={placing || !selectedDate || !selectedTime}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "20px" }}
              >
                {placing ? "Placing Order..." : paymentMethod === "stripe" ? `Pay ${formatPrice(total)}` : "Place Order"}
              </button>

              {paymentMethod !== "stripe" && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px", textAlign: "center", lineHeight: 1.5 }}>
                  {paymentMethod === "etransfer"
                    ? "You'll receive E-Transfer instructions by email. Order pending until payment confirmed."
                    : "Pay cash on pickup/delivery day."}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .container > form > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "20px" }}>
        {title}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span style={{ color: "var(--accent)" }}> *</span>}</label>
      {children}
    </div>
  );
}

function SumRow({ label, value, bold, green }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: bold ? "1rem" : "0.875rem", fontWeight: bold ? 600 : 400, color: green ? "var(--accent)" : "var(--text-main)" }}>
        {value}
      </span>
    </div>
  );
}
