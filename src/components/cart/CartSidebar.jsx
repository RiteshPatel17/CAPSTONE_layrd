"use client";
// ─────────────────────────────────────────────
// LÄYRD – Cart Sidebar
// Slide-in cart panel with item list and totals
// ─────────────────────────────────────────────
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext.jsx";
import { formatPrice, getCartTotals } from "../../lib/pricing.js";

export default function CartSidebar() {
  const { items, subtotal, totalItems, deliveryFee, promoCode, removeItem, updateQuantity, setPromo, removePromo, isCartOpen, closeCart } =
    useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(promoInput.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code");
      } else {
        setPromo(data);
        setPromoInput("");
      }
    } catch (err) {
      setPromoError("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const { discount, gst, total } = getCartTotals(items, deliveryFee, promoCode);

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          onClick={closeCart}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 299,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`cart-sidebar ${isCartOpen ? "open" : ""}`}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <h4 style={{ fontSize: "24px", color: "var(--text-main)" }}>
            Your Cart {totalItems > 0 && <span style={{ color: "var(--accent)" }}>({totalItems})</span>}
          </h4>
          <button
            onClick={closeCart}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "24px",
              lineHeight: "100%",
            }}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "60px" }}>
              {/* Empty cart icon — professional minimal bag */}
              <ShoppingBag size={40} strokeWidth={1} style={{ color: "var(--border-soft)", margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "20px" }}>
                Your cart is empty.
              </p>
              <Link href="/shop" onClick={closeCart}>
                <button className="btn btn-outline btn-sm" style={{ marginTop: "20px" }}>
                  Shop Now
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQuantity={(q) => updateQuantity(item.id, q)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer totals + checkout */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--border-soft)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Promo Code Input */}
            <div style={{ marginBottom: "10px" }}>
              {promoCode ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-soft)", padding: "8px 12px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "16px", color: "var(--accent)", fontWeight: 500 }}>Code: {promoCode.code} applied!</span>
                  <button onClick={removePromo} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}>Remove</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="Promo code" 
                      value={promoInput} 
                      onChange={(e) => setPromoInput(e.target.value)} 
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border-soft)", borderRadius: "4px", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "16px" }} 
                    />
                    <button 
                      onClick={handleApplyPromo} 
                      disabled={promoLoading} 
                      style={{ padding: "8px 16px", background: "var(--text-main)", color: "var(--bg-main)", border: "none", borderRadius: "4px", cursor: promoLoading ? "not-allowed" : "pointer", fontSize: "16px" }}
                    >
                      {promoLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {promoError && <p style={{ color: "red", fontSize: "14px", marginTop: "4px" }}>{promoError}</p>}
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <TotalRow label="Subtotal" value={formatPrice(subtotal)} />
              {discount > 0 && (
                <TotalRow label="Promo" value={`-${formatPrice(discount)}`} accent />
              )}
              {deliveryFee > 0 && (
                <TotalRow label="Delivery" value={formatPrice(deliveryFee)} />
              )}
              <TotalRow label="GST (5%)" value={formatPrice(gst)} />
              <div className="divider" style={{ margin: "8px 0" }} />
              <TotalRow
                label="Total"
                value={formatPrice(total)}
                bold
              />
            </div>

            {/* Checkout button */}
            <Link href="/checkout" onClick={closeCart} style={{ display: "block" }}>
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }}>
                Checkout
              </button>
            </Link>
            <Link href="/cart" onClick={closeCart} style={{ textAlign: "center", fontSize: "16px", color: "var(--text-muted)" }}>
              <button className="btn btn-outline" style={{ width: "100%", padding: "10px", marginTop: "12px" }}>
                View Full Cart
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function CartItem({ item, onRemove, onUpdateQuantity }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        padding: "14px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
      }}
    >
      {/* Cart item thumbnail — soft tinted placeholder (real image when product.image is set) */}
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "4px",
          background: "var(--bg-soft)",
          border: "1px solid var(--border-soft)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
        ) : (
          <ShoppingBag size={18} strokeWidth={1.25} style={{ color: "var(--accent)", opacity: 0.5 }} />
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: "var(--text-main)",
            fontSize: "16px",
            fontWeight: 500,
            marginBottom: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </p>
        {item.sweetness && (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
            {item.sweetness}
          </p>
        )}
        <p style={{ color: "var(--accent)", fontSize: "16px", fontWeight: 600 }}>
          {formatPrice(item.price)}
        </p>

        {/* Quantity controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            style={{
              width: "26px", height: "26px", borderRadius: "50%",
              border: "1px solid var(--border-soft)", background: "none",
              color: "var(--text-main)", cursor: "pointer", fontSize: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            −
          </button>
          <span style={{ fontSize: "16px", color: "var(--text-main)", minWidth: "20px", textAlign: "center" }}>
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            style={{
              width: "26px", height: "26px", borderRadius: "50%",
              border: "1px solid var(--border-soft)", background: "none",
              color: "var(--text-main)", cursor: "pointer", fontSize: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: "20px", lineHeight: "100%",
          flexShrink: 0,
        }}
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  );
}

function TotalRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>{label}</span>
      <span
        style={{
          fontSize: bold ? "1rem" : "0.85rem",
          fontWeight: bold ? 600 : 400,
          color: accent ? "var(--accent)" : "var(--text-main)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
