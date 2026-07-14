"use client";
// ─────────────────────────────────────────────
// LÄYRD – ProductCard
// Displays a product with image (real or fallback) and add-to-cart.
//
// Image logic:
//   1. If product.image has a URL → show it.
//   2. If no URL → cycle through the 3 real LÄYRD product photos
//      using the product's index position as a fallback.
//   These fallback photos live in /images/products/layrd-1/2/3.jpg
// ─────────────────────────────────────────────
import Link from "next/link";
import { useCart } from "../cart/CartContext.jsx";
import { FLAVOURS, PRODUCTS } from "../../data/seed-products.js";
import { formatPrice } from "../../lib/pricing.js";
import toast from "react-hot-toast";

// The 3 real product photos copied from the capstone folder.
// They cycle as fallbacks so every card shows a real dessert image.
const FALLBACK_IMAGES = [
  "/images/products/layrd-1.jpg",  // pistachio tiramisu
  "/images/products/layrd-2.jpg",  // lotus cheesecake
  "/images/products/layrd-3.jpg",  // strawberry matcha
];

const STATUS_LABELS = {
  available:   { label: "Available",   cls: "badge-green" },
  sold_out:    { label: "Sold Out",     cls: "badge-red"   },
  coming_soon: { label: "Coming Soon",  cls: "badge-gray"  },
  hidden:      { label: "Hidden",       cls: "badge-gray"  },
};

export default function ProductCard({ product }) {
  const { items, addItem, updateQuantity, openCart } = useCart();
  const flavour    = FLAVOURS.find((f) => f.id === product.flavourId);
  const statusInfo = STATUS_LABELS[product.status] || STATUS_LABELS.available;

  // Determine fallback image: use product's position in PRODUCTS array mod 3
  const productIndex  = PRODUCTS.findIndex((p) => p.id === product.id);
  const fallbackImage = FALLBACK_IMAGES[productIndex % FALLBACK_IMAGES.length];
  const imageUrl      = product.image || fallbackImage;

  function handleAddToCart(e) {
    e.preventDefault();
    if (product.status !== "available") return;
    addItem({
      id:        product.id,
      name:      product.name,
      flavourId: product.flavourId,
      size:      product.size,
      price:     product.price,
      type:      "can",
      image:     imageUrl,  // pass the resolved image to cart
    });
    toast.success("Added to cart", {
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: '1px solid var(--border)',
      },
    });
  }

  // Check if item is already in cart
  const cartItem = items.find((i) => i.id === product.id);

  function handleIncrement(e) {
    e.preventDefault();
    updateQuantity(product.id, (cartItem?.quantity || 0) + 1);
  }

  function handleDecrement(e) {
    e.preventDefault();
    updateQuantity(product.id, (cartItem?.quantity || 1) - 1);
  }

  return (
    <Link href={`/shop/${product.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Product image ─────────────────────────────────── */}
        <div
          style={{
            height: "240px",
            position: "relative",
            overflow: "hidden",
            background: "var(--bg-soft)",
          }}
        >
          <img
            src={imageUrl}
            alt={flavour?.name || product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              transition: "transform 0.4s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />

          {/* Category badge — top left */}
          <div style={{ position: "absolute", top: "12px", left: "12px" }}>
            <span className={`badge ${product.category === "limited" ? "badge-gold" : "badge-gray"}`}>
              {product.category === "limited" ? "Limited" : "Core"}
            </span>
          </div>

          {/* Status badge — top right (only when not available) */}
          {product.status !== "available" && (
            <div style={{ position: "absolute", top: "12px", right: "12px" }}>
              <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
            </div>
          )}
        </div>

        {/* ── Product info ──────────────────────────────────── */}
        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
            {product.size}ml
          </p>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "var(--text-main)",
              marginBottom: "8px",
              lineHeight: 1.3,
            }}
          >
            {flavour?.name || product.name}
          </h3>
          {flavour && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                flex: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {flavour.description}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.5rem",
                fontWeight: 600,
                /* --price-color: dark brown/gold in day, lighter gold in night */
                color: "var(--price-color)",
                letterSpacing: "0.02em",
              }}
            >
              {formatPrice(product.price)}
            </span>

            {cartItem ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={handleDecrement}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  −
                </button>
                <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)", minWidth: "20px", textAlign: "center" }}>
                  {cartItem.quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={product.status !== "available"}
                className="btn btn-primary btn-sm"
                style={{ fontSize: "0.72rem", padding: "8px 16px" }}
              >
                {product.status === "available" ? "Add to Cart" : statusInfo.label}
              </button>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}
