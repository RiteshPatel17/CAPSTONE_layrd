"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase.js";
import Link from "next/link";
import Image from "next/image";
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

const EVENT_STYLES = `
  .events-page {
    --events-section-gap: clamp(2.5rem, 5vw, 4.5rem);
    --events-section-padding: clamp(2.5rem, 5vw, 4.5rem);
    --events-heading-gap: clamp(1.25rem, 2vw, 2rem);
  }
  .events-section {
    padding: var(--events-section-padding) 24px;
    background: var(--bg-main);
  }
  .events-container {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--events-section-gap);
  }
  .events-heading {
    font-size: 48px;
    margin-bottom: var(--events-heading-gap);
    color: var(--text-main);
    text-align: center;
  }
  .events-pricing-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: clamp(3rem, 7vw, 7rem);
    row-gap: clamp(1.75rem, 3vw, 3rem);
  }
  @media (max-width: 768px) {
    .events-pricing-grid {
      grid-template-columns: 1fr;
    }
  }
  .events-pricing-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: clamp(1.5rem, 3vw, 3rem);
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-soft);
    font-size: 24px;
  }
  .events-pricing-value {
    text-align: right;
    font-weight: 700;
  }
`;

function SafeEventImage({ src, alt, objectPosition = "center", sizes, priority = false }) {
  if (src && src.trim() !== "") {
    return (
      <Image 
        src={src} 
        alt={alt} 
        fill 
        style={{ objectFit: "cover", objectPosition }} 
        sizes={sizes} 
        priority={priority} 
      />
    );
  }
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Image src="/layrd-swirl.png" alt="LÄYRD Logo" width={60} height={60} style={{ opacity: 0.1 }} />
    </div>
  );
}

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

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [siteImages, setSiteImages] = useState({});

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

  useEffect(() => {
  fetch("/api/site-images")
    .then((res) => res.json())
    .then(setSiteImages)
    .catch((err) => console.error("Failed to load site images", err));
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

  const heroImage = siteImages.events_hero || null;
  const safeOccasionImages = [
  siteImages.events_birthday || null,
  siteImages.events_wedding || null,
  siteImages.events_corporate || null,
  ];

  return (
    <div className="events-page">
      <style>{EVENT_STYLES}</style>
      {/* Hero */}
      <section className="events-section" style={{ borderBottom: "1px solid var(--border-soft)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="container" style={{ maxWidth: "1200px", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(1.5rem, 4vw, 3rem)" }}>
          
          <div style={{ maxWidth: "800px" }}>
            <h1 style={{ marginBottom: "var(--events-heading-gap)", fontSize: "56px", color: "var(--text-main)", lineHeight: "1.1" }}>
              Custom Catering for <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Unforgettable</em> Occasions
            </h1>
            <p style={{ fontSize: "24px", maxWidth: "600px", margin: "0 auto", color: "var(--text-muted)" }}>
              Personalized 150ml cake cans for every occasion.
            </p>
          </div>

          {/* Premium Hero Visual Frame */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "600px",
            aspectRatio: "4/3",
            background: "var(--bg-soft)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            transform: "perspective(1000px) rotateX(2deg)",
            transition: "transform 0.5s ease",
            cursor: "pointer"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) scale(1.02)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "perspective(1000px) rotateX(2deg) scale(1)"}
          >
            {/* Decorative background shapes */}
            <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "var(--accent)", opacity: 0.1, zIndex: 0 }} />
            <div style={{ position: "absolute", bottom: "-30px", right: "-30px", width: "150px", height: "150px", borderRadius: "50%", background: "var(--text-main)", opacity: 0.05, zIndex: 0 }} />
            
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", zIndex: 1, backgroundColor: "#f5f5f5" }}>
               <SafeEventImage src={heroImage} alt="LÄYRD Cake Can Event Display" sizes="(max-width: 600px) 100vw, 600px" priority={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="events-section">
        <div className="events-container">

          {/* Occasions Cards */}
          <div>
            <h2 className="events-heading">
              Perfect For Any Occasion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Birthday */}
              <div style={{ background: "#FDF6ED", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", width: "100%", height: "250px", backgroundColor: "#f0e6d2" }}>
                  <SafeEventImage src={safeOccasionImages[0]} alt="Birthdays" objectPosition="center 60%" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div style={{ padding: "30px", textAlign: "center" }}>
                  <h3 style={{ fontSize: "28px", color: "#4A3B32", marginBottom: "10px" }}>Birthdays</h3>
                  <p style={{ color: "#7A6859", fontSize: "16px" }}>Celebrate with a unique layered experience.</p>
                </div>
              </div>

              {/* Weddings */}
              <div style={{ background: "#F9F9F9", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", width: "100%", height: "250px", backgroundColor: "#eaeaea" }}>
                  <SafeEventImage src={safeOccasionImages[1]} alt="Weddings" objectPosition="center 40%" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div style={{ padding: "30px", textAlign: "center" }}>
                  <h3 style={{ fontSize: "28px", color: "#333", marginBottom: "10px" }}>Weddings</h3>
                  <p style={{ color: "#666", fontSize: "16px" }}>Elegant, individually portioned desserts.</p>
                </div>
              </div>

              {/* Corporate */}
              <div style={{ background: "#2C2C2C", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", width: "100%", height: "250px", backgroundColor: "#1a1a1a" }}>
                  <SafeEventImage src={safeOccasionImages[2]} alt="Corporate Events" objectPosition="center 30%" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div style={{ padding: "30px", textAlign: "center" }}>
                  <h3 style={{ fontSize: "28px", color: "#F0F0F0", marginBottom: "10px" }}>Corporate</h3>
                  <p style={{ color: "#A0A0A0", fontSize: "16px" }}>Premium branded gifting and catering.</p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Custom Label Preview */}
          <div>
            <h2 className="events-heading">
              Personalize Your Event
            </h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" }}>
              <p style={{ fontSize: "20px", color: "var(--text-muted)", textAlign: "center", maxWidth: "600px" }}>
                Once your inquiry is approved, you gain access to the AI Label Studio to customize your jars.
              </p>
              
              <div style={{ 
                width: "280px", 
                height: "280px", 
                background: "#FFFFFF", 
                borderRadius: "50%", 
                boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                border: "4px solid #F0F0F0"
              }}>
                <div style={{ marginBottom: "10px" }}>
                  <Image src="/layrd-swirl.png" alt="LÄYRD Swirl" width={80} height={80} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <h4 style={{ fontFamily: "serif", fontSize: "24px", color: "#000", margin: "0 0 5px 0" }}>Your Event</h4>
                  <p style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Custom Label Preview</p>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Flavours */}
          <div>
            <h2 className="events-heading">
              Available Flavours
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-8 max-w-[800px] mx-auto">
              <div style={{ textAlign: "center" }}>
                <h4 style={{ color: "var(--text-main)", fontSize: "24px", marginBottom: "20px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Core Collection</h4>
                {CORE_FLAVOURS.map((f) => (
                  <p key={f} style={{ fontSize: "24px", color: "var(--text-main)", marginBottom: "12px", fontWeight: 500 }}>✦ {f}</p>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <h4 style={{ color: "var(--text-main)", fontSize: "24px", marginBottom: "20px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Limited Edition</h4>
                {LIMITED_FLAVOURS.map((f) => (
                  <p key={f} style={{ fontSize: "24px", color: "var(--text-main)", marginBottom: "12px", fontWeight: 500 }}>✦ {f}</p>
                ))}
              </div>
            </div>
          </div>

          {/* 2. How it works */}
          <div style={{ textAlign: "center" }}>
            <h2 className="events-heading">
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
                  <span style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "20px", lineHeight: "120%" }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Pricing */}
          <div style={{ background: "var(--bg-soft)", padding: "var(--events-section-padding)", borderRadius: "8px", border: "1px solid var(--border-soft)", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
            <h2 className="events-heading">
              Event Pricing
            </h2>
            <div className="events-pricing-grid">
              {TIERS.map((t, i) => (
                <div key={i} className="events-pricing-item">
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{t.label}</span>
                  <span className="events-pricing-value" style={{ color: "var(--text-main)" }}>{t.price}</span>
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
            <div ref={formRef} style={{ background: "var(--surface)", padding: "var(--events-section-padding)", borderRadius: "8px", border: "1px solid var(--border-soft)", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ textAlign: "center", marginBottom: "var(--events-heading-gap)" }}>
                  <h3 style={{ fontSize: "48px", marginBottom: "10px", color: "var(--text-main)" }}>
                    Submit Inquiry
                  </h3>
                  <p style={{ fontSize: "20px", color: "var(--text-muted)" }}>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <div style={{ padding: "20px", background: "var(--bg-soft)", border: "1px solid var(--accent)", borderRadius: "4px", fontSize: "24px", textAlign: "center" }}>
                    <span style={{ color: "var(--text-muted)" }}>Estimated: </span>
                    <strong style={{ color: "var(--text-main)" }}>{totalCans} cans</strong>
                    <span style={{ color: "var(--text-muted)", margin: "0 10px" }}> · </span>
                    <strong style={{ color: "var(--accent)" }}>${estimatedTotal}</strong>
                    {totalCans < EVENT_MIN_CANS && (
                      <div style={{ color: "#ef4444", marginTop: "8px", fontSize: "20px" }}>
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

                <button type="submit" disabled={submitting || totalCans < EVENT_MIN_CANS} className="btn btn-primary btn-lg" style={{ marginTop: "20px", fontSize: "24px", padding: "18px" }}>
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </form>
            </div>
          )}

          {submitted && (
            <div style={{ padding: "var(--events-section-padding)", textAlign: "center", background: "var(--bg-soft)", border: "1px solid #4ade80", borderRadius: "8px" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px", color: "#4ade80" }}>✓</div>
              <h3 style={{ fontSize: "48px", marginBottom: "15px", color: "var(--text-main)" }}>Inquiry Submitted!</h3>
              <p style={{ fontSize: "24px", color: "var(--text-muted)" }}>LÄYRD will review your request and get back to you within 24 hours.</p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}