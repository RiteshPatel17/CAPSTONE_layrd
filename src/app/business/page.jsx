"use client";
// ─────────────────────────────────────────────
// LÄYRD – Business Application page (/business)
// ─────────────────────────────────────────────
import { useState } from "react";

const STEPS = ["Application", "Code Entry", "Dashboard"];

export default function BusinessPage() {
  const [step, setStep] = useState(0); // 0: form, 1: code entry, 2: done
  const [form, setForm] = useState({
    businessName: "", ownerName: "", email: "", phone: "",
    address: "", instagram: "", website: "", notes: "",
  });
  const [file, setFile] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appSubmitted, setAppSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleApplication(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/business-applications", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }
      
      setAppSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    setCodeError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/business-codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      // Success
      setStep(2);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: "80px 24px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "600px" }}>
          <span className="badge badge-gold" style={{ marginBottom: "16px" }}>Business Programme</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "16px" }}>
            Business Account
          </h1>
          <div className="divider-accent" style={{ margin: "0 auto 20px" }} />
          <p style={{ fontSize: "0.95rem" }}>
            Access wholesale pricing, manage orders, and grow your business with LÄYRD.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "680px" }}>
          {/* Progress indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0", marginBottom: "48px" }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                }}>
                  <div
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      border: `2px solid ${i <= step ? "var(--color-accent)" : "var(--border)"}`,
                      background: i < step ? "var(--color-accent)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", color: i < step ? "var(--color-black)" : i === step ? "var(--color-accent)" : "var(--color-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: i <= step ? "var(--color-cream)" : "var(--color-muted)", letterSpacing: "0.05em" }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: "80px", height: "2px", background: i < step ? "var(--color-accent)" : "var(--border)", margin: "0 8px 18px" }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Application form */}
          {step === 0 && !appSubmitted && (
            <form suppressHydrationWarning onSubmit={handleApplication} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "4px" }}>
                Business Application
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-sand)", marginBottom: "8px" }}>
                All fields marked * are required. LÄYRD will review your application within 24–48 hours.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <FormField label="Business Name *">
                  <input className="input" required placeholder="ACME Café" value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </FormField>
                <FormField label="Owner Name *">
                  <input className="input" required placeholder="Jane Doe" value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <FormField label="Email *">
                  <input className="input" type="email" required placeholder="jane@cafe.ca" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </FormField>
                <FormField label="Phone *">
                  <input className="input" type="tel" required placeholder="403-555-0000" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </FormField>
              </div>

              <FormField label="Business Address *">
                <input className="input" required placeholder="123 Main St, Calgary, AB" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <FormField label="Instagram Handle">
                  <input className="input" placeholder="@yourcafé" value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </FormField>
                <FormField label="Website">
                  <input className="input" type="url" placeholder="https://yourcafe.ca" value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </FormField>
              </div>

              <FormField label="Business License / Proof Upload">
                <div style={{ position: "relative" }}>
                  <input 
                    type="file" 
                    accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer"
                    }}
                  />
                  <div style={{ padding: "24px", border: "1px dashed var(--border)", borderRadius: "3px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.85rem", color: file ? "var(--color-accent)" : "var(--color-sand)" }}>
                      {file ? `📎 ${file.name}` : "📎 Click to upload license or proof of business"}
                    </p>
                    {!file && <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "4px" }}>PDF, JPG, PNG (max 10MB)</p>}
                  </div>
                </div>
              </FormField>

              <FormField label="Notes">
                <textarea className="input" rows={3} placeholder="Tell us about your business, typical order sizes, etc."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical" }} />
              </FormField>

              {submitError && <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "8px" }}>{submitError}</p>}
              
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          )}

          {/* Application submitted */}
          {step === 0 && appSubmitted && (
            <div style={{ textAlign: "center", padding: "48px 32px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>📬</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "12px" }}>Application Received</h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "24px" }}>
                LÄYRD will review your application and send a verification code to your email within 24–48 hours.
              </p>
              <button onClick={() => setStep(1)} className="btn btn-outline">
                I already have a code
              </button>
            </div>
          )}

          {/* Step 1: Code entry */}
          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "12px" }}>Enter Verification Code</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-sand)", marginBottom: "28px" }}>
                Enter the single-use code sent to your email. Codes expire in 48 hours.
              </p>
              <form onSubmit={handleCodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="label">Verification Code</label>
                  <input
                    className="input"
                    placeholder="e.g. LAYRD-XXXXX"
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                    style={{ letterSpacing: "0.1em", fontFamily: "monospace", fontSize: "1.1rem" }}
                  />
                  {codeError && <p style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "6px" }}>{codeError}</p>}
                </div>
                <button type="submit" className="btn btn-primary">Activate Account</button>
              </form>
              <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: "16px" }}>
                Demo: use code <strong style={{ color: "var(--color-accent)" }}>LAYRD-DEMO</strong>
              </p>
            </div>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "48px 32px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "4px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🎉</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: "12px" }}>Account Activated!</h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "28px" }}>
                Your business account is now active. Access wholesale pricing and manage your orders.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <a href="/business-dashboard"><button className="btn btn-primary">Go to Dashboard</button></a>
                <a href="/wholesale"><button className="btn btn-outline">View Wholesale</button></a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
