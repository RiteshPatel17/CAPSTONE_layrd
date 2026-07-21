"use client";
// ─────────────────────────────────────────────
// LÄYRD – Order Confirmation page (/confirmation)
// ─────────────────────────────────────────────
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Snowflake } from "lucide-react";  // storage reminder icon
import { BRAND } from "../../lib/constants.js";

function ConfirmationContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order") || "ORD-" + Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="section" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      {/* Success icon */}
      <div
        style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "48px", margin: "0 auto 28px",
        }}
      >
        ✓
      </div>

      <span className="badge badge-green" style={{ marginBottom: "20px" }}>Order Confirmed</span>

      <h1 style={{ fontSize: "48px" /* Simplified fixed size */, marginBottom: "16px" }}>
        Thank you!
      </h1>

      <p style={{ fontSize: "20px", marginBottom: "8px" }}>
        Your order <strong style={{ color: "var(--accent)" }}>{orderNumber}</strong> has been placed.
      </p>
      <p style={{ fontSize: "20px", marginBottom: "8px" }}>
        A confirmation email will be sent to you shortly. LÄYRD will contact you if any details need clarification.
      </p>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px", textAlign: "left" }}>
        {[
          {
            title: "Pickup Location",
            content: `${BRAND.pickupArea}\nExact address in your confirmation email.`,
          },
          {
            title: "Need Help?",
            content: `Email: ${BRAND.email}\nPhone: ${BRAND.phone}`,
          },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: "4px", padding: "20px",
            }}
          >
            <h5 style={{ fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
              {card.title}
            </h5>
            {card.content.split("\n").map((line, i) => (
              <p key={i} style={{ fontSize: "16px", color: "var(--text-main)", marginBottom: "4px" }}>{line}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Storage reminder — Snowflake lucide icon (professional, no emoji) */}
      <div
        style={{
          background: "rgba(184,155,94,0.06)", border: "1px solid rgba(184,155,94,0.18)",
          borderRadius: "4px", padding: "14px 18px", marginBottom: "40px",
          fontSize: "16px", color: "var(--text-muted)", textAlign: "left",
          display: "flex", alignItems: "flex-start", gap: "10px",
        }}
      >
        <Snowflake size={16} strokeWidth={1.5} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
        <span><strong style={{ color: "var(--text-main)" }}>Storage Reminder:</strong> Keep refrigerated. Sealed: 3–5 days. Opened: 24–48 hours.</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/shop">
          <button className="btn btn-primary">Shop Again</button>
        </Link>
        <Link href="/">
          <button className="btn btn-outline">Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="section" style={{ textAlign: "center" }}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
