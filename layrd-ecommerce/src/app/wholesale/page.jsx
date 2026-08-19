"use client";
import { useState, useEffect } from "react";
import WholesaleMedia from "./_components/WholesaleMedia";
import { submitWholesaleApplication } from "../../lib/wholesale-application-client";
import { WHOLESALE_TIERS } from "../../lib/constants";

const FALLBACK_WHOLESALE_HERO = "https://mkuylszbgdmyuhyhkogq.supabase.co/storage/v1/object/public/product-images/CanCake/stack.jpg";

const PRICING_TIERS = WHOLESALE_TIERS.map((tier) => ({
  volume: tier.maxCans === Infinity ? `${tier.minCans}+ cans` : `${tier.minCans}–${tier.maxCans} cans`,
  price: `$${tier.pricePerCan.toFixed(2)}`,
}));

const QUALIFIED_BUSINESSES = [
  "Cafés & Coffee Shops",
  "Restaurants & Bistros",
  "Licensed Retailers",
  "Caterers & Hospitality",
];

const PROCESS_STEPS = [
  { title: "Submit Your Application", desc: "Tell LÄYRD about your business and expected needs." },
  { title: "LÄYRD Reviews It", desc: "The application is reviewed manually." },
  { title: "We Contact You", desc: "The LÄYRD team contacts suitable businesses to discuss products, timing, pricing, and fulfilment." },
];

const KEY_DETAILS = [
  "Minimum order — 24 cans",
  "Notice required — 3–4 business days",
  "Mix Core and Limited cakes",
  "Espresso shots excluded",
  "Approval required",
  "Direct follow-up from LÄYRD",
];

const WHOLESALE_STYLES = `
  .wholesale-page {
    --wholesale-padding: clamp(2.5rem, 5vw, 5rem);
    background: var(--bg-main);
  }
  .wholesale-hero {
    padding-block: var(--wholesale-padding);
    padding-inline: 24px;
    border-bottom: 1px solid var(--border-soft);
  }
  .wholesale-hero-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 5vw, 5rem);
    align-items: center;
  }
  @media (max-width: 768px) {
    .wholesale-hero-content {
      grid-template-columns: 1fr;
      text-align: center;
    }
  }
  .wholesale-heading-main {
    font-size: clamp(36px, 5vw, 56px);
    line-height: 1.1;
    color: var(--text-main);
    margin-bottom: 16px;
  }
  .wholesale-text-large {
    font-size: clamp(16px, 2vw, 20px);
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 24px;
  }
  .wholesale-section {
    padding: var(--wholesale-padding) 24px;
    border-bottom: 1px solid var(--border-soft);
  }
  .wholesale-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .wholesale-heading-section {
    font-size: clamp(32px, 4vw, 48px);
    color: var(--text-main);
    margin-bottom: 32px;
    text-align: center;
  }
  .wholesale-partners {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    padding: clamp(18px, 4vw, 32px);
  }
  .wholesale-partners-grid {
    display: grid;
    grid-template-columns: 55fr 1px 45fr;
    gap: 32px;
  }
  .wholesale-divider {
    background: var(--border-soft);
    width: 100%;
    height: 100%;
  }
  .wholesale-pricing-column, .wholesale-qualifies-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .wholesale-pricing-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-soft);
    padding: 16px 20px;
    border-radius: 4px;
    gap: 16px;
  }
  .wholesale-pricing-qty {
    font-size: 18px;
    font-weight: 500;
    color: var(--text-main);
  }
  .wholesale-pricing-val {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
  }
  .wholesale-pricing-val span {
    font-size: 14px;
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 6px;
  }
  .wholesale-qualifies-item {
    background: var(--bg-soft);
    padding: 16px 20px;
    border-radius: 4px;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-main);
  }
  @media (max-width: 900px) {
    .wholesale-partners-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .wholesale-divider {
      width: 100%;
      height: 1px;
    }
  }
  @media (max-width: 430px) {
    .wholesale-pricing-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .wholesale-pricing-val span {
      margin-left: 4px;
    }
  }
  .wholesale-process {
    display: flex;
    justify-content: space-between;
    gap: 24px;
  }
  @media (max-width: 768px) {
    .wholesale-process {
      flex-direction: column;
    }
  }
  .wholesale-process-step {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border-soft);
    padding: 32px 24px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  .wholesale-process-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
  }
  .wholesale-details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  @media (max-width: 768px) {
    .wholesale-details-grid {
      grid-template-columns: 1fr;
    }
  }
  .wholesale-detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    color: var(--text-main);
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-soft);
  }
  .wholesale-application {
    max-width: 800px;
    margin: 0 auto;
    background: var(--surface);
    padding: clamp(24px, 5vw, 48px);
    border-radius: 8px;
    border: 1px solid var(--border-soft);
  }
  .wholesale-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }
  .wholesale-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .wholesale-input {
    padding: 16px;
    background: transparent;
    border: 1px solid var(--border-soft);
    border-radius: 4px;
    color: var(--text-main);
    font-size: 16px;
    width: 100%;
    font-family: inherit;
  }
  .wholesale-input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .wholesale-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 768px) {
    .wholesale-grid-2 {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }
  .wholesale-btn {
    padding: 20px 40px;
    font-size: 18px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s;
    width: 100%;
  }
  .wholesale-btn:hover {
    opacity: 0.9;
  }
  .wholesale-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function WholesalePage() {
  const [siteImages, setSiteImages] = useState({});

  useEffect(() => {
    fetch("/api/site-images")
      .then((res) => res.json())
      .then(setSiteImages)
      .catch((err) => console.error("Failed to load site images", err));
  }, []);

  // --- Form State ---
  // website_confirm is a visually hidden honeypot field to catch spam bots.
  const [formState, setFormState] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    business_type: "",
    alberta_business_number: "",
    website: "",
    instagram: "",
    expected_volume: "",
    expected_frequency: "",
    notes: "",
    website_confirm: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.business_name || !formState.contact_name || !formState.email || !formState.phone || !formState.business_type) {
      setSubmitStatus({ ok: false, message: "Please fill in all required fields." });
      return;
    }

    if (formState.website_confirm) {
      setSubmitStatus({ ok: true, message: "Your wholesale application has been received. The LÄYRD team will review your information and contact you directly." });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const res = await submitWholesaleApplication(formState);
    setSubmitStatus(res);
    setIsSubmitting(false);
  };

  const scrollToApply = (e) => {
    e.preventDefault();
    const el = document.getElementById("apply");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="wholesale-page">
      <style>{WHOLESALE_STYLES}</style>

      <section className="wholesale-hero">
        <div className="wholesale-hero-content">
          <div>
            <h1 className="wholesale-heading-main">Wholesale, Made Personal</h1>
            <p className="wholesale-text-large">
              LÄYRD works directly with selected business partners to provide premium 150ml cake cans for your customers.
            </p>
            <div style={{ marginBottom: "24px" }}>
              <button onClick={scrollToApply} className="wholesale-btn" style={{ width: "auto", display: "inline-block" }}>
                Apply for Wholesale
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "var(--text-muted)", fontSize: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--accent)" }}>✦</span> Minimum order: 24 cans
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--accent)" }}>✦</span> Notice: 3–4 business days
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--accent)" }}>✦</span> Cake cans only
              </div>
            </div>
          </div>
          <div>
            <WholesaleMedia src={siteImages.wholesale_hero || FALLBACK_WHOLESALE_HERO} priority={true} variant="hero" />
          </div>
        </div>
      </section>

      <section className="wholesale-section">
        <div className="wholesale-container">
          <h2 className="wholesale-heading-section">Wholesale Partners</h2>
          <div className="wholesale-partners">
            <div className="wholesale-partners-grid">
              <div className="wholesale-pricing-column">
                <h3 style={{ fontSize: "20px", color: "var(--text-main)", marginBottom: "4px" }}>Pricing Tiers</h3>
                {PRICING_TIERS.map((tier, index) => (
                  <div key={index} className="wholesale-pricing-row">
                    <span className="wholesale-pricing-qty">{tier.volume}</span>
                    <span className="wholesale-pricing-val">{tier.price} <span>per can</span></span>
                  </div>
                ))}
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "8px" }}>
                  Pricing and availability are confirmed directly by LÄYRD after application review.
                </p>
              </div>
              <div className="wholesale-divider"></div>
              <div className="wholesale-qualifies-column">
                <h3 style={{ fontSize: "20px", color: "var(--text-main)", marginBottom: "4px" }}>Who Qualifies</h3>
                {QUALIFIED_BUSINESSES.map((business, index) => (
                  <div key={index} className="wholesale-qualifies-item">
                    {business}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wholesale-section" style={{ background: "var(--bg-soft)" }}>
        <div className="wholesale-container">
          <h2 className="wholesale-heading-section">How It Works</h2>
          <div className="wholesale-process">
            {PROCESS_STEPS.map((step, index) => (
              <div key={index} className="wholesale-process-step">
                <div className="wholesale-process-number">{index + 1}</div>
                <h3 style={{ fontSize: "24px", color: "var(--text-main)", margin: "0" }}>{step.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "16px", margin: "0" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wholesale-section">
        <div className="wholesale-container">
          <h2 className="wholesale-heading-section">Key Details</h2>
          <div className="wholesale-details-grid">
            {KEY_DETAILS.map((detail, index) => (
              <div key={index} className="wholesale-detail-item">
                <span style={{ color: "var(--accent)" }}>✦</span> {detail}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wholesale-section" style={{ borderBottom: "none", paddingBottom: "80px" }}>
        <div className="wholesale-container">
          <div id="apply" className="wholesale-application">
            {submitStatus?.ok ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "clamp(26px, 4vw, 48px)", marginBottom: "16px", color: "var(--accent)" }}>✓</div>
                <h3 style={{ fontSize: "clamp(24px, 4vw, 32px)", color: "var(--text-main)", marginBottom: "16px" }}>Application Received</h3>
                <p style={{ fontSize: "20px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {submitStatus.message}
                </p>
              </div>
            ) : (
              <>
                <h2 className="wholesale-heading-section" style={{ marginBottom: "32px" }}>Wholesale Application</h2>
                <form onSubmit={handleSubmit}>
                  <div className="wholesale-grid-2">
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Business Name *</label>
                      <input required type="text" name="business_name" value={formState.business_name} onChange={handleInputChange} className="wholesale-input" placeholder="e.g. ACME Café" />
                    </div>
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Contact Name *</label>
                      <input required type="text" name="contact_name" value={formState.contact_name} onChange={handleInputChange} className="wholesale-input" placeholder="e.g. Jane Doe" />
                    </div>
                  </div>

                  <div className="wholesale-grid-2">
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Email *</label>
                      <input required type="email" name="email" value={formState.email} onChange={handleInputChange} className="wholesale-input" placeholder="e.g. hello@acmecafe.ca" />
                    </div>
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Phone *</label>
                      <input required type="tel" name="phone" value={formState.phone} onChange={handleInputChange} className="wholesale-input" placeholder="e.g. 403-555-0123" />
                    </div>
                  </div>

                  <div className="wholesale-grid-2">
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Business Type *</label>
                      <select required name="business_type" value={formState.business_type} onChange={handleInputChange} className="wholesale-input" style={{ appearance: "auto" }}>
                        <option value="" disabled>Select a type...</option>
                        <option value="Café / Coffee Shop">Café / Coffee Shop</option>
                        <option value="Restaurant / Bistro">Restaurant / Bistro</option>
                        <option value="Licensed Retailer">Licensed Retailer</option>
                        <option value="Catering / Hospitality">Catering / Hospitality</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Alberta Business Number</label>
                      <input type="text" name="alberta_business_number" value={formState.alberta_business_number} onChange={handleInputChange} className="wholesale-input" placeholder="Optional" />
                    </div>
                  </div>

                  <div className="wholesale-grid-2">
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Website</label>
                      <input type="url" name="website" value={formState.website} onChange={handleInputChange} className="wholesale-input" placeholder="https://" />
                    </div>
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Instagram</label>
                      <input type="text" name="instagram" value={formState.instagram} onChange={handleInputChange} className="wholesale-input" placeholder="@yourhandle" />
                    </div>
                  </div>

                  <div className="wholesale-grid-2">
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Expected Volume</label>
                      <select name="expected_volume" value={formState.expected_volume} onChange={handleInputChange} className="wholesale-input" style={{ appearance: "auto" }}>
                        <option value="" disabled>Select volume...</option>
                        <option value="24–36 cans">24–36 cans</option>
                        <option value="37–47 cans">37–47 cans</option>
                        <option value="48+ cans">48+ cans</option>
                        <option value="Not sure yet">Not sure yet</option>
                      </select>
                    </div>
                    <div className="wholesale-input-group">
                      <label className="wholesale-label">Expected Frequency</label>
                      <select name="expected_frequency" value={formState.expected_frequency} onChange={handleInputChange} className="wholesale-input" style={{ appearance: "auto" }}>
                        <option value="" disabled>Select frequency...</option>
                        <option value="One-time">One-time</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Biweekly">Biweekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Not sure yet">Not sure yet</option>
                      </select>
                    </div>
                  </div>

                  <div className="wholesale-input-group">
                    <label className="wholesale-label">Notes (Optional)</label>
                    <textarea name="notes" value={formState.notes} onChange={handleInputChange} className="wholesale-input" rows={4} placeholder="Tell us about your business or expected wholesale needs..." style={{ resize: "vertical" }} />
                  </div>

                  <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                    <label>Confirm Website (Do not fill this out)</label>
                    <input type="text" name="website_confirm" value={formState.website_confirm} onChange={handleInputChange} tabIndex="-1" autoComplete="off" />
                  </div>

                  {submitStatus && !submitStatus.ok && (
                    <div style={{ marginBottom: "24px", color: "#f87171", fontSize: "16px", padding: "16px", background: "rgba(248, 113, 113, 0.1)", borderRadius: "4px" }}>
                      {submitStatus.message}
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="wholesale-btn">
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}