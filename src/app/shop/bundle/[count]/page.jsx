"use client";
// ─────────────────────────────────────────────
// LÄYRD – Bundle Customizer (/shop/bundle-[count])
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ArrowLeft, Plus, Minus } from "lucide-react";
import { useCart } from "../../../../components/cart/CartContext.jsx";
import { BUNDLE_PRODUCTS } from "../../../../data/seed-products.js";
import { formatPrice } from "../../../../lib/pricing.js";
import toast from "react-hot-toast";

const FALLBACK_IMAGES = [
  "/images/products/layrd-1.jpg",
  "/images/products/layrd-2.jpg",
  "/images/products/layrd-3.jpg",
];

const isBundleEligibleCake = (product) => {
  const isCake =
    product.dbCategory === "cake" ||
    (!product.dbCategory && ["core", "limited"].includes(product.category));

  return (
    isCake &&
    ["core", "limited"].includes(product.category)
  );
};

export default function BundleBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, openCart } = useCart();

  const countParam = params.count; // e.g. "4" or "6"
  const canCount = parseInt(countParam, 10);

  // Find the bundle definition
  const bundleDef = BUNDLE_PRODUCTS.find((b) => b.canCount === canCount);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state: array of selected product IDs. Allows duplicates!
  const [selection, setSelection] = useState([]);

  // Bundle quantity
  const [bundleQuantity, setBundleQuantity] = useState(1);

  useEffect(() => {
    // If invalid bundle count, redirect to shop
    if (!bundleDef) {
      router.push("/shop");
      return;
    }

    async function loadCans() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const validCans = data.filter(isBundleEligibleCake);
          setProducts(validCans);
        }
      } catch (err) {
        console.error("Failed to load products for bundle", err);
      } finally {
        setLoading(false);
      }
    }
    loadCans();
  }, [bundleDef, router]);

  if (!bundleDef) return null;

  const isFull = selection.length >= canCount;

  function handleSelectProduct(product) {
    if (isFull) return;
    setSelection([...selection, product]);
  }

  function handleRemoveFromSelection(indexToRemove) {
    setSelection(selection.filter((_, idx) => idx !== indexToRemove));
  }

  function handleRemoveOneOfProduct(product) {
    const lastIndex = selection.map(p => p.id).lastIndexOf(product.id);
    if (lastIndex !== -1) {
      handleRemoveFromSelection(lastIndex);
    }
  }

  // Calculate pricing
  let numLimited = 0;
  selection.forEach(p => {
    if (p.category === "limited") numLimited++;
  });

  const limitedPremiumTotal = numLimited * (bundleDef.limitedPremium || 1);
  const bundlePricePerUnit = bundleDef.basePrice + limitedPremiumTotal;
  const totalPrice = bundlePricePerUnit * bundleQuantity;

  function handleAddToCart() {
    if (selection.length !== canCount) {
      toast.error(`Please select exactly ${canCount} items.`);
      return;
    }

    const invalidItems = selection.filter(p => !isBundleEligibleCake(p) || p.status !== "available");
    if (invalidItems.length > 0) {
      toast.error("Invalid or unavailable products in selection.");
      return;
    }

    // Create a description string of what's inside
    const counts = {};
    selection.forEach(p => {
      counts[p.name] = (counts[p.name] || 0) + 1;
    });

    // Sort and map to string
    const summaryStr = Object.entries(counts)
      .map(([name, qty]) => `${qty}x ${name}`)
      .join(", ");

    // Generate unique ID based on selection
    const sortedIds = [...selection].map(p => p.id).sort().join("-");
    const uniqueId = `bundle-${canCount}-${sortedIds}`;

    addItem({
      id: uniqueId,
      name: `Custom ${canCount}-Pack Bundle`,
      price: bundlePricePerUnit,
      quantity: bundleQuantity,
      type: "bundle",
      sweetness: summaryStr, // Re-using sweetness field for the descriptive summary in cart UI
    });

    // Reset and show toast
    setSelection([]);
    setBundleQuantity(1);
    toast.success("Bundle added to cart", {
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: '1px solid var(--border)',
      },
    });
  }

  return (
    <div className="section" style={{ background: "var(--bg-main)" }}>
      <div className="container" style={{ maxWidth: "1200px" }}>
        <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", marginBottom: "32px", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="bundle-layout">

          {/* Left Column: Product Selection */}
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "48px", color: "var(--text-main)", marginBottom: "8px" }}>
                Customize Your {canCount}-Pack
              </h1>
              <p style={{ fontSize: "20px", color: "var(--text-muted)", lineHeight: "160%", maxWidth: "600px" }}>
                Select {canCount} flavours to build your custom bundle. Mix and match your favourites.
                <br />
                <span style={{ color: "var(--accent)", fontSize: "20px" }}>
                  Note: Limited flavours add ${bundleDef.limitedPremium} to the bundle price.
                </span>
              </p>
            </div>

            {loading ? (
              <p>Loading available flavours...</p>
            ) : products.length === 0 ? (
              <div style={{ padding: "40px", background: "var(--bg-soft)", borderRadius: "8px", textAlign: "center", border: "1px dashed var(--border-soft)" }}>
                <p style={{ fontSize: "18px", color: "var(--text-muted)" }}>No eligible cake flavours available at this time.</p>
              </div>
            ) : (
              <div className="bundle-builder-grid">
                {products.map((product, i) => {
                  const isLimited = product.category === "limited";
                  const imageUrl = product.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                  const countSelected = selection.filter(p => p.id === product.id).length;
                  const isAvailable = product.status === "available";

                  return (
                    <div 
                      key={product.id} 
                      className={`bundle-builder-card ${countSelected > 0 ? "bundle-builder-card--selected" : ""} ${!isAvailable ? "disabled" : ""}`}
                    >
                      <div className="bundle-builder-media">
                        <img src={imageUrl} alt={product.name} />
                        <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                          <span className={`badge ${isLimited ? "badge-gold" : "badge-gray"}`} style={{ fontSize: "12px", padding: "4px 8px" }}>
                            {isLimited ? "Limited" : "Core"}
                          </span>
                        </div>
                        {!isAvailable && (
                           <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                             <span className="badge badge-gray" style={{ fontSize: "12px", padding: "4px 8px", textTransform: "capitalize" }}>
                               {product.status.replace("-", " ")}
                             </span>
                           </div>
                        )}
                      </div>

                      <div className="bundle-builder-body">
                        <h4 className="bundle-builder-title">
                          {product.name}
                        </h4>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {isLimited ? (
                            <span style={{ fontSize: "14px", color: "var(--accent)" }}>+${bundleDef.limitedPremium} Premium</span>
                          ) : (
                            <span style={{ fontSize: "14px", color: "var(--text-muted)", visibility: "hidden" }}>Placeholder</span>
                          )}
                        </div>

                        <div className="bundle-builder-action">
                          {countSelected > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-soft)", borderRadius: "4px", overflow: "hidden", width: "100%" }}>
                              <button
                                onClick={() => handleRemoveOneOfProduct(product)}
                                style={{ flex: 1, height: "32px", background: "var(--bg-soft)", border: "none", borderRight: "1px solid var(--border-soft)", cursor: "pointer", color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                aria-label={`Remove one ${product.name}`}
                              ><Minus size={14} /></button>
                              <span style={{ fontSize: "16px", width: "32px", textAlign: "center", fontWeight: 500, color: "var(--text-main)" }}>{countSelected}</span>
                              <button
                                onClick={() => handleSelectProduct(product)}
                                disabled={isFull || !isAvailable}
                                style={{ flex: 1, height: "32px", background: "var(--bg-soft)", border: "none", borderLeft: "1px solid var(--border-soft)", cursor: (isFull || !isAvailable) ? "not-allowed" : "pointer", color: (isFull || !isAvailable) ? "var(--text-muted)" : "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center" }}
                                aria-label={`Add another ${product.name}`}
                              ><Plus size={14} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSelectProduct(product)}
                              disabled={isFull || !isAvailable}
                              className={`btn ${isFull ? "btn-outline" : "btn-primary"} btn-sm`}
                              style={{ width: "100%", padding: "8px", fontSize: "14px" }}
                            >
                              {!isAvailable ? "Unavailable" : "Add"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Bundle Summary Sticky Panel */}
          <div className="bundle-sidebar">

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "32px", color: "var(--text-main)" }}>
                Your Bundle
              </h3>
              <span style={{ fontSize: "20px", color: isFull ? "var(--accent)" : "var(--text-muted)", fontWeight: isFull ? 600 : 400 }}>
                {selection.length} / {canCount}
              </span>
            </div>

            {/* Slots */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
              {Array.from({ length: canCount }).map((_, idx) => {
                const item = selection[idx];

                if (item) {
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-main)", border: "1px solid var(--border-soft)", borderRadius: "6px" }}>
                      <div>
                        <p style={{ fontSize: "20px", color: "var(--text-main)", fontWeight: 500, marginBottom: "2px" }}>{item.name}</p>
                        {item.category === "limited" && <p style={{ fontSize: "14px", color: "var(--accent)" }}>+${bundleDef.limitedPremium} Premium</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveFromSelection(idx)}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--bg-soft)", border: "1px dashed var(--border-soft)", borderRadius: "6px", color: "var(--text-muted)" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: "20px" }}>Select a flavour</span>
                  </div>
                );
              })}
            </div>

            <div className="divider" style={{ marginBottom: "20px" }} />

            {/* Totals & Add to cart */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>Base Price</span>
              <span style={{ fontSize: "20px", color: "var(--text-main)" }}>{formatPrice(bundleDef.basePrice)}</span>
            </div>

            {numLimited > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>Limited Premiums ({numLimited})</span>
                <span style={{ fontSize: "20px", color: "var(--accent)" }}>+ {formatPrice(limitedPremiumTotal)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "20px", color: "var(--text-main)", fontWeight: 600 }}>Total Price</span>
              <span style={{ fontSize: "24px", color: "var(--text-main)", fontWeight: 600 }}>
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Quantity Control for Bundle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "24px" }}>
              <button
                onClick={() => setBundleQuantity(Math.max(1, bundleQuantity - 1))}
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Minus size={18} />
              </button>
              <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-main)", minWidth: "30px", textAlign: "center" }}>
                {bundleQuantity}
              </span>
              <button
                onClick={() => setBundleQuantity(bundleQuantity + 1)}
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--border-soft)", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isFull}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", padding: "14px", fontSize: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}
            >
              {isFull ? (
                <>
                  <span>Add {bundleQuantity > 1 ? `${bundleQuantity} Bundles ` : "Bundle "} to Cart</span>
                  <span style={{ fontSize: "16px", opacity: 0.9 }}>{formatPrice(totalPrice)}</span>
                </>
              ) : (
                <>Select {canCount - selection.length} More Items</>
              )}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
