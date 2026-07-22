"use client";
// ─────────────────────────────────────────────
// LÄYRD – Shop page (/shop)
// Product grid with category filters
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { PRODUCTS, ESPRESSO_PRODUCTS, BUNDLE_PRODUCTS } from "../../data/seed-products.js";
import ProductCard from "../../components/products/ProductCard.jsx";
import { useCart } from "../../components/cart/CartContext.jsx";
import { formatPrice } from "../../lib/pricing.js";
import toast from "react-hot-toast";
import Link from "next/link";

const FILTERS = ["All", "Core Flavours", "Limited Flavours", "Bundles", "Espresso"];

export default function ShopPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const { addItem, openCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("API or logic missing: Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Filter products locally for the tabs
  // Make sure to filter out items named "Espresso Shot" from the cake grid just in case they have wrong DB categories
  let filteredProducts = products.filter(p => !p.name.toLowerCase().includes("espresso shot"));
  if (activeFilter === "Core Flavours") filteredProducts = filteredProducts.filter((p) => p.category === "core");
  else if (activeFilter === "Limited Flavours") filteredProducts = filteredProducts.filter((p) => p.category === "limited");
  else if (activeFilter === "All") filteredProducts = filteredProducts.filter((p) => p.category !== "bundle");
  else filteredProducts = [];

  const showBundles = activeFilter === "All" || activeFilter === "Bundles";
  const showEspresso = activeFilter === "All" || activeFilter === "Espresso";

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "10px" }}>
            LÄYRD Collection
          </p>
          <h1 style={{ marginBottom: "8px" }}>
            The Shop
          </h1>
          <div className="divider-accent" />
        </div>

        {/* Filter tabs */}
        <div className="hide-scrollbar flex-wrap" style={{ display: "flex", gap: "10px", marginBottom: "40px", paddingBottom: "4px" }}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`tag ${activeFilter === filter ? "active" : ""}`}
              style={{ flexShrink: 0 }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Cans grid */}
        {filteredProducts.length > 0 && (
          <>
            <div className="shop-section-header">
              <h2 className="shop-section-heading">
                {activeFilter === "All" ? "Cake in a Can · 250ml" : activeFilter}
              </h2>
            </div>
            <div className="product-grid" style={{ marginBottom: "64px" }}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Bundles */}
        {showBundles && (
          <>
            <div className="shop-section-header">
              <h2 className="shop-section-heading">
                Bundles
              </h2>
              <p className="shop-section-desc">
                Mix and match any flavours. Add $1 per limited flavour included.
              </p>
            </div>
            <div className="product-grid" style={{ marginBottom: "64px" }}>
              {BUNDLE_PRODUCTS.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          </>
        )}

        {/* Espresso */}
        {showEspresso && (
          <>
            <div className="shop-section-header">
              <h2 className="shop-section-heading">
                Espresso Shots
              </h2>
              <p className="shop-section-desc">
                Counts toward your 4-item delivery minimum. Choose your sweetness preference.
              </p>
            </div>
            <div className="product-grid" style={{ marginBottom: "40px" }}>
              {ESPRESSO_PRODUCTS.map((product) => (
                <EspressoCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BundleCard({ bundle }) {
  return (
    <div className="card product-card-container">
      {/* ── Product image ─────────────────────────────────── */}
      <Link href={`/shop/bundle/${bundle.canCount}`} style={{ display: "block" }}>
        <div className="product-card-media">
          <div className="product-card-neutral">
            <span style={{ fontSize: "24px", letterSpacing: "0.2em", fontWeight: 700, color: "var(--accent)" }}>
              LÄYRD
            </span>
          </div>

          {/* Category badge — top left */}
          <div style={{ position: "absolute", top: "12px", left: "12px" }}>
            <span className="badge badge-gold">
              {bundle.canCount} Cans
            </span>
          </div>
        </div>
      </Link>

      {/* ── Product info ──────────────────────────────────── */}
      <div className="product-card-body">
        <Link href={`/shop/bundle/${bundle.canCount}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", flex: 1 }}>
          <p className="product-card-eyebrow">
            Bundle
          </p>
          <h3 className="product-card-title">
            {bundle.name}
          </h3>
          <div className="product-card-desc">
            <p style={{ marginBottom: "8px" }}>{bundle.description}</p>
            <p style={{ fontSize: "13px", opacity: 0.8 }}>+$1 per limited flavour included</p>
          </div>
        </Link>

        <div className="bundle-card-footer">
          <span className="bundle-card-price">
            {formatPrice(bundle.basePrice)}
          </span>
          <Link href={`/shop/bundle/${bundle.canCount}`} className="btn btn-primary btn-sm bundle-card-action" style={{ fontSize: "14px", padding: "8px 16px" }}>
            Customize
          </Link>
        </div>
      </div>
    </div>
  );
}

function EspressoCard({ product }) {
  const { items, addItem, updateQuantity, openCart } = useCart();
  const [sweetness, setSweetness] = useState("Black");

  const cartItemId = `${product.id}-${sweetness}`;
  const cartItem = items.find((i) => i.id === cartItemId);

  function handleAdd(e) {
    e.preventDefault();
    addItem({
      id: cartItemId,
      name: product.name,
      price: product.price,
      type: "espresso",
      quantity: 1,
      sweetness,
    });
    toast.success("Added to cart", {
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: '1px solid var(--border)',
      },
    });
  }

  function handleIncrement(e) {
    e.preventDefault();
    updateQuantity(cartItemId, (cartItem?.quantity || 0) + 1);
  }

  function handleDecrement(e) {
    e.preventDefault();
    updateQuantity(cartItemId, (cartItem?.quantity || 1) - 1);
  }

  return (
    <div className="card product-card-container">
      {/* ── Product image ─────────────────────────────────── */}
      <Link href={`/shop/${product.id}`} style={{ display: "block" }}>
        <div className="product-card-media">
          <img src="/images/products/espresso.png" alt={product.name} />
        </div>
      </Link>

      {/* ── Product info ──────────────────────────────────── */}
      <div className="product-card-body">
        <Link href={`/shop/${product.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}>
          <p className="product-card-eyebrow">
            Espresso
          </p>
          <h3 className="product-card-title">
            {product.name}
          </h3>
        </Link>

        {/* Sweetness selector */}
        <div style={{ marginBottom: "16px", marginTop: "12px" }}>
          <label className="label" style={{ fontSize: "12px", marginBottom: "4px" }}>Sweetness</label>
          <select
            value={sweetness}
            onChange={(e) => setSweetness(e.target.value)}
            className="input"
            style={{ padding: "8px 12px", fontSize: "16px" }}
          >
            {product.sweetness.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="product-card-footer">
          <span className="product-card-price">
            {formatPrice(product.price)}
          </span>

          {cartItem ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleDecrement}
                style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                −
              </button>
              <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-main)", minWidth: "20px", textAlign: "center" }}>
                {cartItem.quantity}
              </span>
              <button
                onClick={handleIncrement}
                style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                +
              </button>
            </div>
          ) : (
            <button onClick={handleAdd} className="btn btn-primary btn-sm" style={{ fontSize: "14px", padding: "8px 16px" }}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
