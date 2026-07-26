"use client";
// ─────────────────────────────────────────────
// LÄYRD – Events / Private Catering page (/events)
// Login required to submit inquiry
// ─────────────────────────────────────────────
// REPLACE WITH:
import { useState, useEffect } from "react";
import Link from "next/link";
import { CORE_FLAVOURS, LIMITED_FLAVOURS, EVENT_MIN_CANS, EVENT_MIN_NOTICE_DAYS } from "../../lib/constants.js";
import { getCurrentUser, getSession } from "../../lib/auth.js";

const TIERS = [
  { label: "Core Can (150ml)", price: "$5 each" },
  { label: "Limited Can (150ml)", price: "$6 each" },
  { label: "Minimum order", price: `${EVENT_MIN_CANS} cans` },
  { label: "Custom labels", price: "Included" },
  { label: "Deposit (on approval)", price: "50% non-refundable" },
  { label: "Minimum notice", price: `${EVENT_MIN_NOTICE_DAYS} business days` },
];

export default function EventsPage() {
  const [form, setForm] = useState({
    eventType: "", eventDate: "", guestCount: "", coreCans: "", limitedCans: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // REPLACE WITH:
  // Real login state, checked against Supabase on mount.
  // WHY a separate "checking" state instead of just isLoggedIn=false→true:
  // without it, a logged-in user would see the locked-out card flash
  // briefly before getCurrentUser() resolves, which looks like a bug.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((user) => {
      if (!cancelled) {
        setIsLoggedIn(!!user);
        setCheckingAuth(false);
      }
    });
    // WHY the cancelled flag: if the user navigates away before this
    // resolves, we don't want to call setState on an unmounted component.
    return () => {
      cancelled = true;
    };
  }, []);

  // REPLACE WITH:
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // WHY we grab the session here rather than relying on isLoggedIn:
      // isLoggedIn just tells us a user exists; the API route needs the
      // actual JWT access token to verify identity server-side.
      const session = await getSession();
      if (!session?.access_token) {
        setSubmitError("Your session has expired. Please log in again.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surfaces the exact server-side validation message (e.g. "Minimum
        // order is 24 cans") rather than a generic failure message.
        setSubmitError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("/events: submit failed:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalCans = (parseInt(form.coreCans) || 0) + (parseInt(form.limitedCans) || 0);
  const estimatedTotal = (parseInt(form.coreCans) || 0) * 5 + (parseInt(form.limitedCans) || 0) * 6;

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #12100a 50%, #0a0a0a 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ maxWidth: "700px", textAlign: "center" }}>
          <span className="badge badge-gold" style={{ marginBottom: "16px" }}>Private Events</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "16px" }}>
            Custom Catering for<br /><em style={{ color: "var(--color-accent)", fontStyle: "italic" }}>Unforgettable</em> Occasions
          </h1>
          <div className="divider-accent" style={{ margin: "0 auto 20px" }} />
          <p style={{ fontSize: "0.95rem", maxWidth: "500px", margin: "0 auto" }}>
            From intimate celebrations to corporate events — LÄYRD creates personalized 150ml cake cans 
            with AI-designed custom labels for every occasion.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "64px" }}>
            {/* Info sidebar */}
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "24px" }}>
                Event Pricing
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {TIERS.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "14px 0", borderBottom: "1px solid var(--border)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <span style={{ color: "var(--color-sand)" }}>{t.label}</span>
                    <span style={{ color: "var(--color-cream)", fontWeight: 500 }}>{t.price}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "32px", padding: "20px",
                  background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.15)", borderRadius: "4px",
                }}
              >
                <h5 style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                  How it works
                </h5>
                {[
                  "Submit your inquiry below",
                  "Adam reviews and approves/rejects",
                  "Pay 50% deposit to confirm",
                  "Design your custom labels in AI Label Studio",
                  "Collect or receive delivery",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--color-accent)", flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
                    <span style={{ color: "var(--color-sand)" }}>{step}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "24px" }}>
                <h5 style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
                  Available Flavours
                </h5>
                <p style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginBottom: "8px" }}>Core — $5/can</p>
                {CORE_FLAVOURS.map((f) => <p key={f} style={{ fontSize: "0.85rem", color: "var(--color-sand)", marginBottom: "4px" }}>✦ {f}</p>)}
                <p style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginTop: "12px", marginBottom: "8px" }}>Limited — $6/can</p>
                {LIMITED_FLAVOURS.map((f) => <p key={f} style={{ fontSize: "0.85rem", color: "var(--color-sand)", marginBottom: "4px" }}>✦ {f}</p>)}
              </div>
            </div>

            {/* Inquiry form */}
            <div>
              {!isLoggedIn ? (
                <div
                  style={{
                    padding: "48px 36px", textAlign: "center",
                    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px",
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>🔐</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "12px" }}>
                    Login Required
                  </h3>
                  <p style={{ fontSize: "0.9rem", marginBottom: "28px" }}>
                    Please create an account or log in to submit an event inquiry.
                  </p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/login"><button className="btn btn-primary">Log In</button></Link>
                    <Link href="/signup"><button className="btn btn-outline">Create Account</button></Link>
                  </div>
                </div>
              ) : submitted ? (
                <div style={{ padding: "48px", textAlign: "center", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "4px" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>✓</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "12px" }}>Inquiry Submitted!</h3>
                  <p>Adam will review your request and get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", marginBottom: "4px" }}>
                    Submit Inquiry
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-sand)", marginBottom: "4px" }}>
                    Min. {EVENT_MIN_CANS} cans. At least {EVENT_MIN_NOTICE_DAYS} business days notice required.
                  </p>

                  <div>
                    <label className="label">Event Type *</label>
                    <select className="input" required value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                      <option value="">Select event type</option>
                      {["Birthday", "Wedding", "Corporate", "Baby Shower", "Anniversary", "Other"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label className="label">Event Date *</label>
                      <input className="input" type="date" required value={form.eventDate}
                        min={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Estimated Guests</label>
                      <input className="input" type="number" min="1" placeholder="50" value={form.guestCount}
                        onChange={(e) => setForm({ ...form, guestCount: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label className="label">Core Cans ($5 each)</label>
                      <input className="input" type="number" min="0" placeholder="0" value={form.coreCans}
                        onChange={(e) => setForm({ ...form, coreCans: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Limited Cans ($6 each)</label>
                      <input className="input" type="number" min="0" placeholder="0" value={form.limitedCans}
                        onChange={(e) => setForm({ ...form, limitedCans: e.target.value })} />
                    </div>
                  </div>

                  {/* Live estimate */}
                  {totalCans > 0 && (
                    <div style={{ padding: "14px 18px", background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: "3px", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--color-sand)" }}>Estimated: </span>
                      <strong style={{ color: "var(--color-cream)" }}>{totalCans} cans</strong>
                      <span style={{ color: "var(--color-sand)" }}> · </span>
                      <strong style={{ color: "var(--color-accent)" }}>${estimatedTotal}</strong>
                      {totalCans < EVENT_MIN_CANS && (
                        <span style={{ color: "#f87171", marginLeft: "12px" }}>
                          (Min. {EVENT_MIN_CANS} cans)
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="label">Additional Notes</label>
                    <textarea className="input" rows={4} placeholder="Label preferences, dietary restrictions, delivery details..."
                      value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical" }} />
                  </div>

                  {submitError && (
                    <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "3px", fontSize: "0.85rem", color: "#f87171" }}>
                      {submitError}
                    </div>
                  )}

                  <button type="submit" disabled={submitting || totalCans < EVENT_MIN_CANS} className="btn btn-primary btn-lg">
                    {submitting ? "Submitting..." : "Submit Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .container > div[style*="grid-template-columns: 1fr 1.4fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
