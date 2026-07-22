"use client";
// ─────────────────────────────────────────────
// LÄYRD – Contact page (/contact)
// ─────────────────────────────────────────────
import { useState } from "react";
import { Mail, Phone, MapPin, ExternalLink, CheckCircle } from "lucide-react";
import { BRAND } from "../../lib/constants.js";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Something went wrong. Please email us directly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="section" style={{ background: "var(--bg-main)" }}>
      <div className="container" style={{ maxWidth: "1000px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ fontSize: "20px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px", fontWeight: 600 }}>
            Get in Touch
          </p>
          <h1 style={{ marginBottom: "12px", fontSize: "48px", color: "var(--text-main)" }}>Contact Us</h1>
          <div className="divider-accent" style={{ margin: "0 auto" }} />
        </div>

        <div className="responsive-grid-1-1-6" style={{ gap: "64px", alignItems: "start" }}>
          {/* Info */}
          <div>
            <h3 style={{ fontSize: "48px", marginBottom: "24px", color: "var(--text-main)", lineHeight: "120%" }}>
              We'd love to hear from you.
            </h3>
            <p style={{ fontSize: "20px", marginBottom: "40px", lineHeight: "160%", color: "var(--text-main)" }}>
              Whether you have a question about our products, want to place a wholesale order,
              or are planning a private event — we're here to help.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {[
                { Icon: Mail, label: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
                { Icon: Phone, label: "Phone", value: BRAND.phone, href: `tel:${BRAND.phone}` },
                { Icon: MapPin, label: "Location", value: BRAND.pickupArea },
                { Icon: ExternalLink, label: "Instagram", value: BRAND.instagram, href: "https://instagram.com/l.a.y.r.d" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <item.Icon size={28} strokeWidth={1.5} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "16px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
                      {item.label}
                    </p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined}
                        style={{ fontSize: "24px", color: "var(--text-main)", transition: "color 0.2s", fontWeight: 500 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-main)"}
                      >{item.value}</a>
                    ) : (
                      <p style={{ fontSize: "24px", color: "var(--text-main)", margin: 0, fontWeight: 500 }}>{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "40px", padding: "24px", background: "var(--bg-soft)", border: "1px solid var(--border-soft)", borderRadius: "8px" }}>
              <h5 style={{ fontSize: "20px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px", color: "var(--text-main)", fontWeight: 600 }}>
                Response Time
              </h5>
              <p style={{ fontSize: "20px", color: "var(--text-muted)", margin: 0 }}>
                We typically respond within 24 hours, Monday–Friday.
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            {sent ? (
              <div
                style={{
                  padding: "60px 40px", textAlign: "center",
                  background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "8px",
                }}
              >
                <CheckCircle size={48} strokeWidth={1.5} style={{ color: "var(--accent)", margin: "0 auto 20px" }} />
                <h3 style={{ fontSize: "48px", marginBottom: "16px", color: "var(--text-main)" }}>Message Sent!</h3>
                <p style={{ fontSize: "20px", color: "var(--text-muted)" }}>Thank you for reaching out. We'll be in touch shortly.</p>
                <button onClick={() => setSent(false)} className="btn btn-outline" style={{ marginTop: "30px", padding: "12px 30px", fontSize: "20px" }}>
                  Send Another
                </button>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", padding: "40px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div className="responsive-grid-2" style={{ gap: "20px" }}>
                    <div>
                      <label className="label" style={{ fontSize: "20px", color: "var(--text-main)", fontWeight: 500 }}>Name *</label>
                      <input className="input" required placeholder="Jane Doe"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        style={{ padding: "14px", fontSize: "20px" }} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: "20px", color: "var(--text-main)", fontWeight: 500 }}>Email *</label>
                      <input className="input" type="email" required placeholder="jane@example.com"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{ padding: "14px", fontSize: "20px" }} />
                    </div>
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: "20px", color: "var(--text-main)", fontWeight: 500 }}>Subject</label>
                    <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      style={{ padding: "14px", fontSize: "20px" }}>
                      <option value="">Select a subject</option>
                      <option>General Inquiry</option>
                      <option>Order Support</option>
                      <option>Wholesale Inquiry</option>
                      <option>Private Event</option>
                      <option>Media / Press</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: "20px", color: "var(--text-main)", fontWeight: 500 }}>Message *</label>
                    <textarea
                      className="input"
                      rows={6}
                      required
                      placeholder="Tell us how we can help..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      style={{ resize: "vertical", padding: "14px", fontSize: "20px" }}
                    />
                  </div>

                  {error && <p style={{ fontSize: "20px", color: "#ef4444", fontWeight: 500 }}>{error}</p>}

                  <button type="submit" disabled={sending} className="btn btn-primary btn-lg" style={{ padding: "16px", fontSize: "20px", marginTop: "10px" }}>
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
