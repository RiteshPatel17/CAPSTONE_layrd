"use client";
// ─────────────────────────────────────────────
// LÄYRD – Cart page (/cart)
// Full cart view with item management and totals
// ─────────────────────────────────────────────
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../../components/cart/CartContext.jsx";
import { formatPrice, getCartTotals } from "../../lib/pricing.js";
import { DELIVERY_MIN_ITEMS } from "../../lib/constants.js";

export default function CartPage() {
  const {
    items, subtotal, totalItems, deliveryFee, promoCode,
    removeItem, updateQuantity, clearCart,
    setPromo, removePromo, meetsDeliveryMinimum,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  const { discount, gst, total } = getCartTotals(items, deliveryFee, promoCode);

  // Mock promo code validation
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  async function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingPromo(true);
    setPromoError("");

    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code.");
      } else {
        setPromo(data);
        setPromoInput("");
      }
    } catch (err) {
      setPromoError("Failed to apply promo code. Try again later.");
    } finally {
      setIsApplyingPromo(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <div style={{ padding: "80px 0" }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🍰</div>
            <h2 style={{ marginBottom: "12px" }}>Your cart is empty</h2>
            <p style={{ marginBottom: "32px" }}>Add some delicious items to get started!</p>
            <Link href="/shop">
              <button className="btn btn-primary btn-lg">Browse the Shop</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "4px" }}>Your Cart</h1>
            <p style={{ fontSize: "0.875rem" }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={clearCart} className="btn btn-ghost btn-sm">
            Clear Cart
          </button>
        </div>

        {/* Delivery minimum notice */}
        {!meetsDeliveryMinimum && (
          <div
            style={{
              background: "rgba(201,169,110,0.08)",
              border: "1px solid rgba(201,169,110,0.2)",
              borderRadius: "4px",
              padding: "14px 20px",
              marginBottom: "24px",
              fontSize: "0.875rem",
              color: "var(--color-accent)",
            }}
          >
            ℹ Add {DELIVERY_MIN_ITEMS - totalItems} more item{DELIVERY_MIN_ITEMS - totalItems !== 1 ? "s" : ""} to unlock delivery.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "40px", alignItems: "start" }}>
          {/* Item list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onUpdateQuantity={(q) => updateQuantity(item.id, q)}
              />
            ))}
          </div>

          {/* Order summary sidebar */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "28px",
              position: "sticky",
              top: "calc(var(--nav-height) + 24px)",
            }}
          >
            <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", marginBottom: "20px" }}>
              Order Summary
            </h4>

            {/* Totals */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              {discount > 0 && <Row label={`Promo (${promoCode?.code})`} value={`-${formatPrice(discount)}`} green />}
              <Row label={`Delivery ${meetsDeliveryMinimum ? "" : "(min. 4 items)"}`} value={deliveryFee > 0 ? formatPrice(deliveryFee) : "TBD at checkout"} />
              <Row label="GST (5%)" value={formatPrice(gst)} />
            </div>

            <div className="divider" style={{ margin: "0 0 16px" }} />

            <Row label="Total" value={formatPrice(total)} bold />

            {/* Promo code */}
            <div style={{ marginTop: "20px" }}>
              {promoCode ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "3px", padding: "10px 14px", fontSize: "0.85rem" }}>
                  <span style={{ color: "#4ade80" }}>✓ {promoCode.code} applied</span>
                  <button onClick={removePromo} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-sand)", fontSize: "0.8rem" }}>Remove</button>
                </div>
              ) : (
                <div>
                  <label className="label">Promo Code</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <input
                      className="input"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Enter code"
                      style={{ flex: 1 }}
                    />
                    <button onClick={handleApplyPromo} disabled={isApplyingPromo} className="btn btn-outline btn-sm">{isApplyingPromo ? "Applying..." : "Apply"}</button>
                  </div>
                  {promoError && <p style={{ fontSize: "0.78rem", color: "#f87171", marginTop: "6px" }}>{promoError}</p>}
                </div>
              )}
            </div>

            {/* Checkout button */}
            <Link href="/checkout" style={{ display: "block", marginTop: "20px" }}>
              <button className="btn btn-primary" style={{ width: "100%" }}>
                Proceed to Checkout
              </button>
            </Link>

            <Link href="/shop" style={{ display: "block", textAlign: "center", marginTop: "12px", fontSize: "0.8rem", color: "var(--color-sand)" }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>



    </div>
  );
}

function CartRow({ item, onRemove, onUpdateQuantity }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "64px 1fr auto",
        gap: "20px",
        alignItems: "center",
        padding: "20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
      }}
    >
      {/* Image */}
      <div
        style={{
          width: "64px", height: "64px", borderRadius: "4px",
          background: "var(--border)", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
        }}
      >
        {item.type === "espresso" ? "☕" : "🍰"}
      </div>

      {/* Info */}
      <div>
        <p style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--color-cream)", marginBottom: "2px" }}>
          {item.name}
        </p>
        {item.sweetness && <p style={{ fontSize: "0.78rem", color: "var(--color-sand)" }}>Sweetness: {item.sweetness}</p>}
        {item.size && <p style={{ fontSize: "0.78rem", color: "var(--color-sand)" }}>{item.size}ml</p>}

        {/* Quantity controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
          <button onClick={() => onUpdateQuantity(item.quantity - 1)} style={qBtnStyle}>−</button>
          <span style={{ fontSize: "0.95rem", color: "var(--color-cream)", minWidth: "28px", textAlign: "center" }}>{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item.quantity + 1)} style={qBtnStyle}>+</button>
          <button onClick={onRemove} style={{ ...qBtnStyle, marginLeft: "8px", border: "1px solid #7f1d1d", color: "#f87171" }}>✕</button>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "var(--color-accent)" }}>
          {formatPrice(item.price * item.quantity)}
        </p>
        {item.quantity > 1 && (
          <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{formatPrice(item.price)} each</p>
        )}
      </div>
    </div>
  );
}

const qBtnStyle = {
  width: "30px", height: "30px", border: "1px solid var(--border)",
  background: "none", color: "var(--color-cream)", cursor: "pointer",
  borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center",
};

function Row({ label, value, bold, green }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--color-sand)" }}>{label}</span>
      <span style={{ fontSize: bold ? "1rem" : "0.875rem", fontWeight: bold ? 600 : 400, color: green ? "#4ade80" : "var(--color-cream)" }}>
        {value}
      </span>
    </div>
  );
}
