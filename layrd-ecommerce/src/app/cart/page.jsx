"use client";
// ─────────────────────────────────────────────
// LÄYRD – Cart page (/cart)
// Full cart view with item management and totals
// ─────────────────────────────────────────────
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../components/cart/CartContext.jsx";
import { formatPrice, getCartTotals } from "../../lib/pricing.js";
import { DELIVERY_MIN_ITEMS } from "../../lib/constants.js";
import { supabase } from "../../lib/supabase.js";
import AuthGateModal from "../../components/auth/AuthGateModal.jsx";

// Basic fallback swirl if no image_url is provided
function FallbackImage() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "6px" }}>
      <Image src="/layrd-swirl.png" alt="Fallback" width={32} height={32} style={{ opacity: 0.1 }} />
    </div>
  );
}

export default function CartPage() {
  const {
    items, subtotal, totalItems, deliveryFee, promoCode,
    removeItem, updateQuantity, clearCart,
    setPromo, removePromo, meetsDeliveryMinimum,
  } = useCart();

  const router = useRouter();
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  async function handleCheckoutClick() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/checkout");
    } else {
      setShowAuthGate(true);
    }
  }

  function handleAuthenticated() {
    setShowAuthGate(false);
    router.push("/checkout");
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => { if (data.success) setSettings(data.settings); })
      .catch((err) => console.error("Failed to load settings", err));
  }, []);

  const { discount, gst, total } = getCartTotals(
    items, deliveryFee, promoCode,
    settings?.gstRate != null ? settings.gstRate / 100 : undefined
  );

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
      <div className="section" style={{ textAlign: "center", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="container">
          <div style={{ fontSize: "clamp(26px, 4vw, 48px)", marginBottom: "20px" }}>🛒</div>
          <h2 style={{ marginBottom: "12px", color: "var(--text-main)" }}>Your cart is empty</h2>
          <p style={{ marginBottom: "32px", color: "var(--text-muted)" }}>Add some delicious items to get started!</p>
          <Link href="/shop">
            <button className="btn btn-primary" style={{ padding: "12px 32px", fontSize: "16px" }}>Browse the Shop</button>
          </Link>
        </div>
      </div>
    );
  }

  // Fulfilment logic
  const itemsNeeded = Math.max(0, DELIVERY_MIN_ITEMS - totalItems);
  const progressPercent = Math.min(100, (totalItems / DELIVERY_MIN_ITEMS) * 100);

  return (
    <div className="section">
      <style>{`
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }
        }
        
        .cart-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .cart-header-title {
          font-size: clamp(32px, 4vw, 40px);
          color: var(--text-main);
          margin-bottom: 24px;
        }
        .cart-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          margin-bottom: 32px;
          background: var(--surface-muted);
          border: 1px solid var(--border-soft);
          border-radius: 8px;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        .cart-meta-badge {
          background: var(--surface);
          border: 1px solid var(--border-soft);
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
          display: inline-flex;
          align-items: center;
        }

        .cart-meta-clear {
          background: transparent;
          border: 1px solid var(--border-soft);
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cart-meta-clear:hover {
          background: var(--bg-soft);
          color: var(--text-main);
          border-color: var(--text-muted);
        }
        
        .cart-banner {
          background: var(--surface-muted);
          border: 1px solid var(--border-soft);
          border-radius: 6px;
          padding: 16px 20px;
          margin-bottom: 32px;
        }
        
        .cart-banner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .cart-banner-header {
            flex-wrap: wrap;
            align-items: flex-start;
          }
        }
        
        .cart-progress-badge {
          background: var(--surface);
          border: 1px solid var(--border-soft);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
        }
        
        .cart-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 20px;
          padding: 24px 0;
          border-bottom: 1px solid var(--border-soft);
          align-items: center;
        }
        @media (max-width: 600px) {
          .cart-item {
            grid-template-columns: auto 1fr;
            grid-template-areas: 
              "img info"
              "img price";
            gap: 16px;
          }
          .cart-item-img { grid-area: img; }
          .cart-item-info { grid-area: info; }
          .cart-item-price { 
            grid-area: price; 
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
        }
        
        .cart-item-media {
          width: 96px;
          height: 96px;
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--border-soft);
        }
        @media (max-width: 600px) {
          .cart-item-media {
            width: 76px;
            height: 76px;
          }
        }
        
        .quantity-controls {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--border-soft);
          border-radius: 4px;
          background: var(--surface);
          overflow: hidden;
        }
        .quantity-btn {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .quantity-btn:hover {
          background: var(--bg-soft);
        }
        .quantity-val {
          width: 32px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
        }
        
        .remove-btn {
          background: none;
          border: none;
          color: #f87171;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
          padding: 4px;
        }
        .remove-btn:hover {
          color: #dc2626;
        }
        
        .summary-panel {
          background: var(--surface);
          border: 1px solid var(--border-soft);
          border-radius: 8px;
          padding: 24px;
          position: sticky;
          top: calc(var(--nav-height) + 24px);
        }
        
        .summary-details {
          margin-bottom: 24px;
        }
        .summary-details summary {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-soft);
        }
        .summary-details summary::-webkit-details-marker {
          display: none;
        }
        .summary-content {
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-bottom: 1px solid var(--border-soft);
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        
        .promo-section {
          margin-bottom: 24px;
        }
      `}</style>

      <div className="container" style={{ maxWidth: "1200px" }}>
        
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-header-title">Your Cart</h1>
        </div>

        {/* Meta Row */}
        <div className="cart-meta-row">
          <span className="cart-meta-badge">
            {totalItems} item{totalItems !== 1 ? "s" : ""}
          </span>
          <button 
            onClick={clearCart} 
            className="cart-meta-clear"
          >
            Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          {/* Main Cart Items Area */}
          <div>
            {/* Eligibility Banner */}
            <div className="cart-banner">
              {!meetsDeliveryMinimum ? (
                <>
                  <div className="cart-banner-header">
                    <span style={{ fontSize: "16px", color: "var(--text-main)", fontWeight: "500" }}>
                      Pickup is available. Add {itemsNeeded} more item{itemsNeeded !== 1 ? "s" : ""} to unlock delivery.
                    </span>
                    <span className="cart-progress-badge">
                      {totalItems} of {DELIVERY_MIN_ITEMS} items
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "var(--border-soft)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }}></div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "16px", color: "var(--text-main)", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> Delivery and pickup are available for this order.
                </div>
              )}
            </div>

            {/* Item List */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQuantity={(q) => updateQuantity(item.id, q)}
                />
              ))}
            </div>
          </div>

          {/* Sidebar / Summary */}
          <div className="summary-panel">
            <details className="summary-details" open={summaryOpen} onToggle={(e) => setSummaryOpen(e.target.open)}>
              <summary>
                <span>Order Summary</span>
                <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "normal" }}>
                  {summaryOpen ? "Hide Details" : "Show Details"}
                </span>
              </summary>
              <div className="summary-content">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                {discount > 0 && <Row label={`Promo (${promoCode?.code})`} value={`-${formatPrice(discount)}`} green />}
                <Row label={`Delivery ${meetsDeliveryMinimum ? "" : "(min. 4 items)"}`} value={deliveryFee > 0 ? formatPrice(deliveryFee) : "TBD at checkout"} />
                <Row label={`GST (${settings?.gstRate ?? 5}%)`} value={formatPrice(gst)} />
              </div>
            </details>

            <div style={{ marginBottom: "24px" }}>
              <Row label="Total" value={formatPrice(total)} bold />
            </div>

            {/* Promo Code */}
            <div className="promo-section">
              {promoCode ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "4px", padding: "10px 14px", fontSize: "14px" }}>
                  <span style={{ color: "#4ade80", fontWeight: "500" }}>✓ {promoCode.code} applied</span>
                  <button onClick={removePromo} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>Remove</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      className="input"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Promo Code"
                      style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border-soft)", borderRadius: "4px", background: "transparent", color: "var(--text-main)" }}
                    />
                    <button onClick={handleApplyPromo} disabled={isApplyingPromo} style={{ padding: "0 16px", background: "var(--surface-muted)", border: "1px solid var(--border-soft)", borderRadius: "4px", color: "var(--text-main)", cursor: "pointer", fontWeight: "500" }}>
                      {isApplyingPromo ? "..." : "Apply"}
                    </button>
                  </div>
                  {promoError && <p style={{ fontSize: "14px", color: "#f87171", marginTop: "8px" }}>{promoError}</p>}
                </div>
              )}
            </div>

            {/* Actions */}
            <button onClick={handleCheckoutClick} className="btn btn-primary" style={{ width: "100%", padding: "16px", fontSize: "16px" }}>
              Proceed to Checkout
            </button>

            <Link href="/shop" style={{ display: "block", textAlign: "center", marginTop: "16px", fontSize: "15px", color: "var(--text-muted)", textDecoration: "underline" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <AuthGateModal
        open={showAuthGate}
        onAuthenticated={handleAuthenticated}
        onClose={() => setShowAuthGate(false)}
        subtitle="Log in to continue to checkout."
      />
    </div>
  );
}

function CartRow({ item, onRemove, onUpdateQuantity }) {
  // Reads the backend-provided image URL if available, otherwise safely falls back.
  const imageUrl = item.imageUrl || item.image_url;

  return (
    <div className="cart-item">
      {/* Image */}
      <div className="cart-item-img">
        <div className="cart-item-media">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={item.name} 
              fill 
              style={{ objectFit: "cover" }} 
              sizes="120px" 
            />
          ) : (
            <FallbackImage />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="cart-item-info">
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-main)", margin: "0 0 4px 0" }}>
          {item.name}
        </h3>
        {item.sweetness && <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 2px 0" }}>Sweetness: {item.sweetness}</p>}
        {item.size && <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>{item.size}ml</p>}
        
        {/* Quantity Controls (Mobile flow can sometimes push this to price column, but we keep it here in DOM) */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
          <div className="quantity-controls">
            <button onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))} className="quantity-btn">−</button>
            <span className="quantity-val">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.quantity + 1)} className="quantity-btn">+</button>
          </div>
          <button onClick={onRemove} className="remove-btn">Remove</button>
        </div>
      </div>

      {/* Price */}
      <div className="cart-item-price" style={{ textAlign: "right" }}>
        <p style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-main)", margin: "0 0 4px 0" }}>
          {formatPrice(item.price * item.quantity)}
        </p>
        {item.quantity > 1 && (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            {formatPrice(item.price)} each
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, green }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "15px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: bold ? "18px" : "15px", fontWeight: bold ? "600" : "500", color: green ? "#4ade80" : "var(--text-main)" }}>
        {value}
      </span>
    </div>
  );
}