"use client";
import Link from "next/link";
import { FileText, CheckCircle2, KeyRound, UserPlus, ShoppingBag } from "lucide-react";
import { WHOLESALE_TIERS, WHOLESALE_MIN_CANS, WHOLESALE_NOTICE_DAYS } from "../../lib/constants.js";
import { formatPrice } from "../../lib/pricing.js";

export default function WholesalePage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: "40px 24px 20px", background: "var(--bg-main)", borderBottom: "1px solid var(--border-soft)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <span className="badge badge-gold" style={{ marginBottom: "12px" }}>Trade Pricing</span>
          <h1 style={{ marginBottom: "10px", fontSize: "48px", color: "var(--text-main)", lineHeight: "100%" }}>
            Partner with <em style={{ color: "var(--accent)", fontStyle: "italic" }}>LÄYRD</em>
          </h1>
          <p style={{ fontSize: "20px", maxWidth: "600px", margin: "10px auto 0", color: "var(--text-muted)" }}>
            Premium 150ml cake cans at trade prices.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: "60px 24px", background: "var(--bg-main)" }}>
        <div className="container" style={{ maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "80px" }}>

          {/* 1. Pricing */}
          <div style={{ background: "var(--bg-soft)", padding: "50px", borderRadius: "8px", border: "1px solid var(--border-soft)", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            <h2 style={{ fontSize: "48px", marginBottom: "30px", color: "var(--text-main)", textAlign: "center" }}>
              Wholesale Pricing
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "600px", margin: "0 auto" }}>
              {WHOLESALE_TIERS.map((tier, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "15px", borderBottom: "1px solid var(--border-soft)", fontSize: "24px" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                    {tier.maxCans === Infinity ? `${tier.minCans}+ cans` : `${tier.minCans}–${tier.maxCans} cans`}
                  </span>
                  <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{formatPrice(tier.pricePerCan)} / can</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. How it works */}
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <h2 style={{ fontSize: "48px", marginBottom: "50px", color: "var(--text-main)" }}>
              How It Works
            </h2>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
              {[
                { text: "Apply Online", icon: <FileText size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "LÄYRD Reviews", icon: <CheckCircle2 size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "Receive Access Code", icon: <KeyRound size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "Activate Account", icon: <UserPlus size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "Order Wholesale!", icon: <ShoppingBag size={42} strokeWidth={1.5} color="var(--accent)" /> }
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", flex: "1 1 150px" }}>
                  <div>{step.icon}</div>
                  <span style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "20px", lineHeight: "120%" }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Who Qualifies */}
          <div style={{ padding: "20px 0", maxWidth: "800px", margin: "0 auto", textAlign: "center", width: "100%" }}>
            <h2 style={{ fontSize: "48px", marginBottom: "30px", color: "var(--text-main)" }}>
              Who Qualifies?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              {["Licensed retailers", "Cafés & coffee shops", "Restaurants & bistros", "Food service operators", "Corporate & office catering"].map((item, i) => (
                <div key={i} style={{ padding: "24px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "8px", fontSize: "24px", color: "var(--text-main)", fontWeight: 500 }}>
                  ✦ {item}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Key Details */}
          <div style={{ padding: "20px 0", maxWidth: "800px", margin: "0 auto", textAlign: "center", width: "100%" }}>
            <h2 style={{ fontSize: "48px", marginBottom: "30px", color: "var(--text-main)" }}>
              Key Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "left", background: "var(--surface)", padding: "40px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
              {[
                `Minimum order: ${WHOLESALE_MIN_CANS} cans`,
                `Notice required: ${WHOLESALE_NOTICE_DAYS}–4 business days`,
                "Mix any core or limited flavours",
                "Espresso shots not included in wholesale",
                "Approval-based ordering system",
                "Business account required",
              ].map((item, i) => (
                <p key={i} style={{ fontSize: "24px", color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--accent)", marginRight: "10px" }}>✦</span>
                  <strong style={{ color: "var(--text-main)" }}>{item.split(":")[0]}</strong>
                  {item.includes(":") ? `:${item.split(":")[1]}` : ""}
                </p>
              ))}
            </div>
          </div>

          {/* Centered Buttons */}
          <div style={{ textAlign: "center", marginTop: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <Link href="/business">
              <button
                style={{
                  padding: "20px 60px",
                  fontSize: "24px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  background: "var(--accent)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(184,155,94,0.3)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  width: "fit-content"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Apply for Wholesale
              </button>
            </Link>

            <Link href="/business">
              <button
                style={{
                  padding: "16px 40px",
                  fontSize: "20px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: "transparent",
                  color: "var(--text-main)",
                  border: "2px solid var(--border-soft)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                  width: "fit-content"
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.color = "var(--text-main)"; }}
              >
                Got an access code from LÄYRD? Activate Account
              </button>
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
