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
            <h3
              style={{
                fontSize: "32px",
                marginBottom: "24px",
                color: "var(--color-cream)",
              }}
            >
              {activeFilter === "All" ? "Cake in a Can · 250ml" : activeFilter}
            </h3>
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
            <h3 style={{ fontSize: "32px", marginBottom: "8px" }}>
              Bundles
            </h3>
            <p style={{ fontSize: "16px", color: "var(--color-sand)", marginBottom: "24px" }}>
              Mix and match any flavours. Add $1 per limited flavour included.
            </p>
            <div className="bundle-grid-auto" style={{ marginBottom: "64px" }}>
              {BUNDLE_PRODUCTS.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          </>
        )}

        {/* Espresso */}
        {showEspresso && (
          <>
            <h3 style={{ fontSize: "32px", marginBottom: "8px" }}>
              Espresso Shots
            </h3>
            <p style={{ fontSize: "16px", color: "var(--color-sand)", marginBottom: "24px" }}>
              Counts toward your 4-item delivery minimum. Choose your sweetness preference.
            </p>
            <div className="espresso-grid-auto" style={{ marginBottom: "40px" }}>
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
    <div className="card" style={{ padding: "28px" }}>
      <div className="flex-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: "10px" }}>
            {bundle.canCount} Cans
          </span>
          <h4
            style={{
              fontSize: "24px",
              color: "var(--color-cream)",
              marginTop: "8px",
            }}
          >
            {bundle.name}
          </h4>
        </div>
        <div style={{ fontSize: "32px", color: "var(--color-accent)" }}>
          {formatPrice(bundle.basePrice)}
        </div>
      </div>
      <p style={{ fontSize: "16px", color: "var(--color-sand)", marginBottom: "20px", lineHeight: "160%" }}>
        {bundle.description}
      </p>
      <p style={{ fontSize: "16px", color: "var(--color-muted)", marginBottom: "20px" }}>
        +$1 per limited flavour included
      </p>
      <a href={`/shop/bundle/${bundle.canCount}`}>
        <button className="btn btn-primary" style={{ width: "100%" }}>
          Customize Bundle
        </button>
      </a>
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
    <Link href={`/shop/${product.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Product Image */}
        <div
          style={{
            height: "180px",
            position: "relative",
            overflow: "hidden",
            background: "var(--bg-soft)",
          }}
        >
          <img
            src="/images/products/espresso.png"
            alt={product.name}
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
        </div>

        <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
          <h4
            style={{
              fontSize: "24px",
              color: "var(--color-cream)",
              marginBottom: "4px",
            }}
          >
            {product.name}
          </h4>
          <p style={{ fontSize: "24px", color: "var(--color-accent)", marginBottom: "16px" }}>
            {formatPrice(product.price)}
          </p>

          {/* Sweetness selector */}
          <div style={{ marginBottom: "16px", flex: 1 }}>
            <label className="label">Sweetness</label>
            <select
              value={sweetness}
              onClick={(e) => e.preventDefault()}
              onChange={(e) => {
                e.preventDefault();
                setSweetness(e.target.value);
              }}
              className="input"
              style={{ marginTop: "6px" }}
            >
              {product.sweetness.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {cartItem ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
              <button
                onClick={handleDecrement}
                style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                −
              </button>
              <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-main)", minWidth: "20px", textAlign: "center", flex: 1 }}>
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
            <button onClick={handleAdd} className="btn btn-primary" style={{ width: "100%", marginTop: "auto" }}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
