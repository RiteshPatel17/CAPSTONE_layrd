"use client";
// ─────────────────────────────────────────────
// LÄYRD – Homepage
// Hero + featured products + brand story
// ─────────────────────────────────────────────
import Link from "next/link";
import { Truck, MapPin, CalendarDays, Store, AlertTriangle } from "lucide-react";
import { PRODUCTS } from "../data/seed-products.js";
import { BRAND, STORAGE_INFO } from "../lib/constants.js";
import ProductCard from "../components/products/ProductCard.jsx";

export default function HomePage() {
  const featuredProducts = PRODUCTS.filter((p) => p.status === "available").slice(0, 3);

  return (
    <>
      {/* ─── Hero ─── */}
      <section
        className="hero-gradient"
        style={{
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative rings */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            border: "1px solid rgba(184,155,94,0.12)",
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "900px",
            height: "900px",
            border: "1px solid rgba(184,155,94,0.06)",
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        <div className="animate-fade-in" style={{ position: "relative", zIndex: 1 }}>
          {/* Pre-title */}
          <p
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              marginBottom: "20px",
              fontWeight: 500,
            }}
          >
            Calgary · Boutique Desserts
          </p>

          {/* Brand name */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(4rem, 12vw, 10rem)",
              fontWeight: 700,
              letterSpacing: "0.25em",
              color: "var(--text-primary)",
              lineHeight: 0.9,
              marginBottom: "24px",
            }}
          >
            {BRAND.name}
          </h1>

          {/* Gold divider */}
          <div
            style={{
              width: "60px",
              height: "2px",
              background: "var(--accent-primary)",
              margin: "0 auto 24px",
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
              color: "var(--text-secondary)",
              letterSpacing: "0.1em",
              marginBottom: "48px",
              fontStyle: "italic",
            }}
          >
            {BRAND.tagline}
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/shop">
              <button className="btn btn-primary btn-lg">Shop Now</button>
            </Link>
            <Link href="/events">
              <button className="btn btn-outline btn-lg">Private Events</button>
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 1s ease 1s both",
          }}
        >
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-secondary)", opacity: 0.7 }}>
            Scroll
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, var(--accent-primary), transparent)",
            }}
          />
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      <section className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "12px" }}>
              Handcrafted
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Our Signature Flavours
            </h2>
            <div className="divider-accent" style={{ margin: "16px auto" }} />
            <p style={{ maxWidth: "480px", margin: "0 auto", fontSize: "0.95rem" }}>
              Premium cheesecakes and tiramisus, crafted fresh and served in convenient 250ml cans.
            </p>
          </div>

          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link href="/shop">
              <button className="btn btn-outline">View All Flavours</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Brand Story ─── */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "64px",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "12px" }}>
                Our Story
              </p>
              <h2 style={{ marginBottom: "20px" }}>
                Boutique Desserts, <br />
                <em style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>Crafted with Intent</em>
              </h2>
              <div className="divider-accent" />
              <p style={{ marginBottom: "16px" }}>
                LÄYRD was born from a simple belief: exceptional desserts shouldn&apos;t require a celebration.
                Our handcrafted cheesecakes and tiramisus are layered with care — each 250ml can a
                perfectly portioned indulgence.
              </p>
              <p style={{ marginBottom: "32px" }}>
                Made fresh in Calgary&apos;s Pineridge NE neighbourhood. Available for pickup and
                Calgary-wide delivery.
              </p>
              <Link href="/shop">
                <button className="btn btn-primary">Explore the Shop</button>
              </Link>
            </div>

            {/* Right: Storage info card */}
            <div
              style={{
                background: "var(--surface-primary)",
                border: "1px solid var(--border-soft)",
                borderRadius: "4px",
                padding: "40px",
              }}
            >
              <h4
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.4rem",
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}
              >
                Fresh. Always.
              </h4>
              <div className="divider-accent" />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                {STORAGE_INFO.map((info, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: "2px" }}>✦</span>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{info}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid var(--border-soft)",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={1.5}
                  style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: "2px" }}
                />
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  Contains dairy, gluten, and may contain nuts. Check individual product pages for full allergen info.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive fix */}


      </section>

      {/* ─── Services Banner ─── */}
      <section
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-soft)",
          borderBottom: "1px solid var(--border-soft)",
          padding: "48px 0",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
              textAlign: "center",
            }}
          >
            {[
              { Icon: Truck,        title: "Calgary Delivery",  text: "Fast delivery across Calgary from $5" },
              { Icon: MapPin,       title: "Pickup Available",  text: "Order online, collect in Pineridge NE" },
              { Icon: CalendarDays, title: "Private Events",    text: "Custom orders with AI-designed labels" },
              { Icon: Store,        title: "Wholesale",         text: "Trade pricing for retailers & food service" },
            ].map((item) => (
              <div key={item.title}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "2px",
                    border: "1px solid var(--border-soft)",
                    margin: "0 auto 16px",
                    color: "var(--accent-primary)",
                  }}
                >
                  <item.Icon size={22} strokeWidth={1.25} />
                </div>
                <h5
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  {item.title}
                </h5>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section
        className="hero-gradient"
        style={{
          padding: "100px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(184,155,94,0.06) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ marginBottom: "20px" }}>
            Ready to Get <em style={{ color: "var(--accent-primary)", fontStyle: "italic" }}>LÄYRD</em>?
          </h2>
          <p style={{ maxWidth: "400px", margin: "0 auto 36px", fontSize: "0.95rem" }}>
            Order online and enjoy premium desserts at home. Minimum 4 items for delivery.
          </p>
          <Link href="/shop">
            <button className="btn btn-primary btn-lg">Shop the Collection</button>
          </Link>
        </div>
      </section>
    </>
  );
}
