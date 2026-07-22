"use client";
// ─────────────────────────────────────────────
// LÄYRD – FAQ page (/faq)
// Accordion FAQ with category filters
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { getFaqs } from "../../lib/admin-faq.js";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const data = await getFaqs();
        const publishedFaqs = data.filter((f) => f.is_published);
        setFaqs(publishedFaqs);
        
        // Extract unique categories
        const cats = Array.from(new Set(publishedFaqs.map((f) => f.category)));
        setCategories(["All", ...cats]);
      } catch (err) {
        console.error("Failed to load FAQs", err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const filtered = activeCategory === "All"
    ? faqs
    : faqs.filter((faq) => faq.category === activeCategory);

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "12px" }}>
            Help Centre
          </p>
          <h1 style={{ marginBottom: "12px" }}>
            Frequently Asked Questions
          </h1>
          <div className="divider-accent" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: "20px" }}>
            Can't find what you're looking for?{" "}
            <a href="/contact" style={{ color: "var(--color-accent)", borderBottom: "1px solid var(--color-accent)" }}>
              Contact us
            </a>
          </p>
        </div>

        {/* Category filters */}
        {!loading && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "36px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`tag ${activeCategory === cat ? "active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Accordion */}
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading FAQs...</div>
          ) : (
            filtered.map((faq) => (
            <div key={faq.id} className="accordion-item">
              <button
                className="accordion-trigger"
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                aria-expanded={openId === faq.id}
              >
                <span style={{ fontWeight: 500, paddingRight: "16px" }}>{faq.question}</span>
                <span
                  style={{
                    fontSize: "24px",
                    color: "var(--color-accent)",
                    flexShrink: 0,
                    transition: "transform 0.25s",
                    transform: openId === faq.id ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>

              {openId === faq.id && (
                <div className="accordion-content animate-fade-in">
                  {faq.answer.split("\n").map((line, i) => (
                    <p key={i} style={{ fontSize: "20px", lineHeight: "160%", marginBottom: line.startsWith("•") ? "4px" : "0" }}>
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )))}
        </div>

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "var(--color-sand)" }}>No FAQs in this category yet.</p>
          </div>
        )}

        {/* Still need help */}
        <div
          style={{
            marginTop: "60px", padding: "40px", textAlign: "center",
            background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px",
          }}
        >
          <h3 style={{ marginBottom: "12px" }}>
            Still have questions?
          </h3>
          <p style={{ marginBottom: "24px", fontSize: "20px" }}>
            Reach us at <a href="mailto:info@layrd.org" style={{ color: "var(--color-accent)" }}>info@layrd.org</a> or{" "}
            <a href="tel:4033993903" style={{ color: "var(--color-accent)" }}>403-399-3903</a>
          </p>
          <a href="/contact">
            <button className="btn btn-primary">Contact Us</button>
          </a>
        </div>
      </div>
    </div>
  );
}
