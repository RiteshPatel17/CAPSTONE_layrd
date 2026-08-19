"use client";
// ─────────────────────────────────────────────
// LÄYRD – Product detail page — THE DETAIL PAGE
// Goes at: src/app/shop/[id]/page.jsx  (note the [id] folder!)
// ─────────────────────────────────────────────
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { STORAGE_INFO } from "../../../lib/constants.js";
import { useCart } from "../../../components/cart/CartContext.jsx";
import { formatPrice } from "../../../lib/pricing.js";
import toast from "react-hot-toast";

const SWEETNESS_OPTIONS = ["Black", "Sugar", "Stevia", "Brown Sugar"];

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [sweetness, setSweetness] = useState("Black");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const found = (data || []).find((p) => p.id === params.id);
        setProduct(found || null);
      } catch (err) {
        console.error("Failed to load product", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <p style={{ color: "var(--color-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <h2>Product not found</h2>
          <Link href="/shop">
            <button className="btn btn-primary" style={{ marginTop: "24px" }}>Back to Shop</button>
          </Link>
        </div>
      </div>
    );
  }

  const isEspresso = product.dbCategory === "espresso";
  const isAvailable = product.status === "available" || isEspresso;

  function handleAddToCart() {
    if (!isAvailable) return;
    addItem({
      id: isEspresso ? `${product.id}-${sweetness}` : product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      type: isEspresso ? "espresso" : "can",
      sweetness: isEspresso ? sweetness : undefined,
      image: product.image,
      quantity,
    });
    toast.success("Added to cart", {
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: '1px solid var(--border)',
      },
    });
  }

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "40px", fontSize: "16px", color: "var(--color-muted)" }}>
          <Link href="/" style={{ color: "var(--color-muted)" }}>Home</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: "var(--color-muted)" }}>Shop</Link>
          <span>/</span>
          <span style={{ color: "var(--color-sand)" }}>{product.name}</span>
        </div>

        <div className="responsive-grid-2" style={{ gap: "64px", alignItems: "start" }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(26px, 4vw, 48px)",
              position: "sticky",
              top: "calc(var(--nav-height) + 24px)",
              overflow: "hidden",
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              isEspresso ? "☕" : "🍰"
            )}
          </div>

          <div>
            {product.category && (
              <span className={`badge ${product.category === "limited" ? "badge-gold" : "badge-gray"}`} style={{ marginBottom: "16px" }}>
                {product.category === "limited" ? "Limited Edition" : "Core Flavour"}
              </span>
            )}

            <h1
              style={{
                fontSize: "clamp(26px, 4vw, 48px)",
                lineHeight: "100%",
                marginBottom: "8px",
              }}
            >
              {product.name}
            </h1>

            {product.size && (
              <p style={{ fontSize: "16px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "16px" }}>
                {product.size}ml · Handcrafted
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <span style={{ fontSize: "clamp(26px, 4vw, 48px)", color: "var(--price-color)", fontWeight: 600 }}>
                {formatPrice(product.price)}
              </span>
              <span className={`badge ${isAvailable ? "badge-green" : "badge-red"}`}>
                {isAvailable ? "In Stock" : product.status === "coming_soon" ? "Coming Soon" : "Sold Out"}
              </span>
            </div>

            <div className="divider" style={{ margin: "0 0 24px" }} />

            {product.description && (
              <p style={{ fontSize: "20px", lineHeight: "160%", marginBottom: "28px" }}>
                {product.description}
              </p>
            )}

            {isEspresso && (
              <div style={{ marginBottom: "24px" }}>
                <label className="label">Sweetness Preference</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                  {SWEETNESS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSweetness(s)}
                      className={`tag ${sweetness === s ? "active" : ""}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "28px" }}>
              <label className="label">Quantity</label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: "36px", height: "36px", border: "1px solid var(--border)",
                    background: "none", color: "var(--color-cream)", cursor: "pointer",
                    borderRadius: "2px", fontSize: "24px",
                  }}
                >−</button>
                <span style={{ fontSize: "20px", color: "var(--color-cream)", minWidth: "32px", textAlign: "center" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{
                    width: "36px", height: "36px", border: "1px solid var(--border)",
                    background: "none", color: "var(--color-cream)", cursor: "pointer",
                    borderRadius: "2px", fontSize: "24px",
                  }}
                >+</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
              >
                {isAvailable ? "Add to Cart" : "Not Available"}
              </button>
            </div>

            {product.ingredients && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "20px", marginBottom: "20px" }}>
                <h5 style={{ fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Ingredients
                </h5>
                <p style={{ fontSize: "16px", color: "var(--color-sand)", lineHeight: "160%" }}>
                  {product.ingredients}
                </p>
              </div>
            )}

            {product.allergens && product.allergens.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Contains
                </h5>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {product.allergens.map((a) => (
                    <span key={a} className="badge badge-gray">
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <h5 style={{ fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
                Storage & Freshness
              </h5>
              {STORAGE_INFO.map((info, i) => (
                <p key={i} style={{ fontSize: "16px", color: "var(--color-sand)", marginBottom: "6px" }}>
                  ✦ {info}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
