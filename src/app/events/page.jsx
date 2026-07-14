"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CORE_FLAVOURS, LIMITED_FLAVOURS, EVENT_MIN_CANS, EVENT_MIN_NOTICE_DAYS } from "../../lib/constants.js";
import { FileText, CheckCircle2, CreditCard, Wand2, Truck } from "lucide-react";

const TIERS = [
  { label: "Core Can (150ml)", price: "$5 each" },
  { label: "Limited Can (150ml)", price: "$6 each" },
  { label: "Minimum order", price: `${EVENT_MIN_CANS} cans` },
  { label: "Custom labels", price: "Included" },
  { label: "Deposit (on approval)", price: "50% non-refundable" },
  { label: "Minimum notice", price: `${EVENT_MIN_NOTICE_DAYS} business days` },
];

export default function EventsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    eventType: "", eventDate: "", guestCount: "", coreCans: "", limitedCans: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const formRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isLoggedIn = !!session;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit inquiry");
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGetStarted() {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  const totalCans = (parseInt(form.coreCans) || 0) + (parseInt(form.limitedCans) || 0);
  const estimatedTotal = (parseInt(form.coreCans) || 0) * 5 + (parseInt(form.limitedCans) || 0) * 6;

  return (
    <div>
      {/* Hero (Reduced space) */}
      <section style={{ padding: "40px 24px 20px", background: "var(--bg-main)", borderBottom: "1px solid var(--border-soft)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <span className="badge badge-gold" style={{ marginBottom: "12px" }}>Private Events</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "10px", fontSize: "3.5rem", color: "var(--text-main)", lineHeight: "1.1" }}>
            Custom Catering for <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Unforgettable</em> Occasions
          </h1>
          <p style={{ fontSize: "1.1rem", maxWidth: "600px", margin: "10px auto 0", color: "var(--text-muted)" }}>
            Personalized 150ml cake cans for every occasion.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: "60px 24px", background: "var(--bg-main)" }}>
        <div className="container" style={{ maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "80px" }}>
          
          {/* 1. Flavours */}
          <div style={{ padding: "20px 0" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.8rem", marginBottom: "40px", color: "var(--text-main)", textAlign: "center" }}>
              Available Flavours
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "30px", maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ textAlign: "center" }}>
                <h4 style={{ color: "var(--text-main)", fontSize: "1.4rem", marginBottom: "20px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Core Collection</h4>
                {CORE_FLAVOURS.map((f) => (
                  <p key={f} style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "12px", fontWeight: 500 }}>✦ {f}</p>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <h4 style={{ color: "var(--text-main)", fontSize: "1.4rem", marginBottom: "20px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Limited Edition</h4>
                {LIMITED_FLAVOURS.map((f) => (
                  <p key={f} style={{ fontSize: "1.25rem", color: "var(--text-main)", marginBottom: "12px", fontWeight: 500 }}>✦ {f}</p>
                ))}
              </div>
            </div>
          </div>

          {/* 2. How it works */}
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.8rem", marginBottom: "50px", color: "var(--text-main)" }}>
              How It Works
            </h2>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
              {[
                { text: "Submit Inquiry", icon: <FileText size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "LÄYRD Reviews & Approves", icon: <CheckCircle2 size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "Pay 50% Deposit", icon: <CreditCard size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "Design Labels (AI)", icon: <Wand2 size={42} strokeWidth={1.5} color="var(--accent)" /> },
                { text: "Collect or Delivery", icon: <Truck size={42} strokeWidth={1.5} color="var(--accent)" /> }
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", flex: "1 1 150px" }}>
                  <div>
                    {step.icon}
                  </div>
                  <span style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "1.15rem", lineHeight: "1.3" }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Pricing */}
          <div style={{ background: "var(--bg-soft)", padding: "50px", borderRadius: "8px", border: "1px solid var(--border-soft)", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.8rem", marginBottom: "30px", color: "var(--text-main)", textAlign: "center" }}>
              Event Pricing
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "600px", margin: "0 auto" }}>
              {TIERS.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "15px", borderBottom: "1px solid var(--border-soft)", fontSize: "1.2rem" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{t.label}</span>
                  <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{t.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Get Started Button */}
          {!showForm && !submitted && (
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <button 
                onClick={handleGetStarted}
                style={{
                  padding: "20px 60px",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  background: "var(--accent)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(184,155,94,0.3)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Get a Quote
              </button>
            </div>
          )}

          {/* Inquiry Form */}
          {showForm && !submitted && (
            <div ref={formRef} style={{ background: "var(--surface)", padding: "60px", borderRadius: "8px", border: "1px solid var(--border-soft)", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.4rem", marginBottom: "10px", color: "var(--text-main)" }}>
                    Submit Inquiry
                  </h3>
                  <p style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>
                    Min. {EVENT_MIN_CANS} cans. At least {EVENT_MIN_NOTICE_DAYS} business days notice required.
                  </p>
                </div>

                <div>
                  <label className="label">Event Type *</label>
                  <select className="input" required value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                    <option value="">Select event type</option>
                    {["Birthday", "Wedding", "Corporate", "Baby Shower", "Anniversary", "Other"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
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
                  <div style={{ padding: "20px", background: "var(--bg-soft)", border: "1px solid var(--accent)", borderRadius: "4px", fontSize: "1.2rem", textAlign: "center" }}>
                    <span style={{ color: "var(--text-muted)" }}>Estimated: </span>
                    <strong style={{ color: "var(--text-main)" }}>{totalCans} cans</strong>
                    <span style={{ color: "var(--text-muted)", margin: "0 10px" }}> · </span>
                    <strong style={{ color: "var(--accent)" }}>${estimatedTotal}</strong>
                    {totalCans < EVENT_MIN_CANS && (
                      <div style={{ color: "#ef4444", marginTop: "8px", fontSize: "1rem" }}>
                        (Minimum {EVENT_MIN_CANS} cans required)
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="label">Additional Notes</label>
                  <textarea className="input" rows={4} placeholder="Label preferences, dietary restrictions, delivery details..."
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical" }} />
                </div>

                <button type="submit" disabled={submitting || totalCans < EVENT_MIN_CANS} className="btn btn-primary btn-lg" style={{ marginTop: "20px", fontSize: "1.2rem", padding: "18px" }}>
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </form>
            </div>
          )}

          {submitted && (
            <div style={{ padding: "60px 40px", textAlign: "center", background: "var(--bg-soft)", border: "1px solid #4ade80", borderRadius: "8px", marginTop: "20px" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "20px", color: "#4ade80" }}>✓</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.6rem", marginBottom: "15px", color: "var(--text-main)" }}>Inquiry Submitted!</h3>
              <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>LÄYRD will review your request and get back to you within 24 hours.</p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
