"use client";
// ─────────────────────────────────────────────
// LÄYRD – Wholesale page (/wholesale)
// ─────────────────────────────────────────────
import Link from "next/link";
import { WHOLESALE_TIERS, WHOLESALE_MIN_CANS, WHOLESALE_NOTICE_DAYS } from "../../lib/constants.js";
import { formatPrice } from "../../lib/pricing.js";

export default function WholesalePage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: "80px 24px", background: "var(--bg-soft)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: "700px", textAlign: "center" }}>
          <span className="badge badge-gold" style={{ marginBottom: "16px" }}>Trade Pricing</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "16px" }}>
            Wholesale Programme
          </h1>
          <div className="divider-accent" style={{ margin: "0 auto 20px" }} />
          <p style={{ fontSize: "0.95rem" }}>
            Premium 250ml cake cans at trade prices for licensed retailers, cafés, restaurants, and food service operators.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
            {/* Pricing table */}
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "24px" }}>
                Pricing Tiers
              </h3>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order Quantity</th>
                      <th>Price per Can</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WHOLESALE_TIERS.map((tier, i) => (
                      <tr key={i}>
                        <td>{tier.maxCans === Infinity ? `${tier.minCans}+ cans` : `${tier.minCans}–${tier.maxCans} cans`}</td>
                        <td style={{ color: "var(--accent)", fontWeight: 500 }}>{formatPrice(tier.pricePerCan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "24px", padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px" }}>
                <h5 style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
                  Key Details
                </h5>
                {[
                  `Minimum order: ${WHOLESALE_MIN_CANS} × 250ml cans`,
                  `Notice required: ${WHOLESALE_NOTICE_DAYS}–4 business days`,
                  "Mix any core or limited flavours",
                  "Espresso shots not included in wholesale",
                  "Approval-based ordering system",
                  "Business account required",
                ].map((item, i) => (
                  <p key={i} style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                    ✦ {item}
                  </p>
                ))}
              </div>
            </div>

            {/* How it works + CTA */}
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "24px" }}>
                Who Qualifies?
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "36px" }}>
                {["Licensed retailers", "Cafés & coffee shops", "Restaurants & bistros", "Food service operators", "Corporate & office catering"].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ color: "var(--accent)", fontSize: "1rem" }}>✓</span>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>{item}</span>
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "20px" }}>
                How It Works
              </h3>
              {[
                { step: "1", title: "Apply for a Business Account", text: "Submit your business details and proof of license." },
                { step: "2", title: "Receive Verification Code", text: "Adam reviews and sends a one-time activation code." },
                { step: "3", title: "Access Wholesale Dashboard", text: "Enter your code to unlock trade pricing." },
                { step: "4", title: "Place Wholesale Orders", text: "Submit orders for approval. Pay after Adam confirms." },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                  <div
                    style={{
                      width: "32px", height: "32px", flexShrink: 0, borderRadius: "50%",
                      border: "1px solid var(--accent)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600,
                    }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-main)", marginBottom: "2px" }}>{s.title}</p>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{s.text}</p>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <Link href="/business">
                  <button className="btn btn-primary">Apply for Business Account</button>
                </Link>
                <Link href="/contact">
                  <button className="btn btn-outline">Ask a Question</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .container > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
