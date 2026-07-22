// ─────────────────────────────────────────────
// LÄYRD – Footer
// ─────────────────────────────────────────────
import Link from "next/link";
import { BRAND, NAV_LINKS } from "../../lib/constants.js";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        {/* Top section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "clamp(32px, 5vw, 64px)",
            padding: "clamp(60px, 8vw, 120px) 0 clamp(40px, 5vw, 60px)",
            maxWidth: "960px",
            margin: "0 auto",
          }}
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                fontSize: "48px",
                fontWeight: 700,
                letterSpacing: "0.3em",
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              {BRAND.name}
            </div>
            <p style={{ fontSize: "16px", lineHeight: "160%", maxWidth: "240px", marginBottom: "0" }}>
              {BRAND.tagline}
            </p>
            <p
              style={{
                fontSize: "24px",
                color: "var(--text-secondary)",
                marginTop: "16px",
              }}
            >
              {BRAND.pickupArea}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h5
              style={{
                fontSize: "16px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "24px",
                }}
            >
              Shop
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "16px",
                    color: "var(--text-secondary)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h5
              style={{
                fontSize: "14px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "24px",
                }}
            >
              Contact
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href={`mailto:${BRAND.email}`}
                style={{ fontSize: "16px", color: "var(--text-secondary)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
              >
                {BRAND.email}
              </a>
              <a
                href={`tel:${BRAND.phone}`}
                style={{ fontSize: "16px", color: "var(--text-secondary)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
              >
                {BRAND.phone}
              </a>
              <a
                href="https://www.instagram.com/l.a.y.r.d"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "16px", color: "var(--text-secondary)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
              >
                {BRAND.instagram}
              </a>
            </div>
          </div>

          {/* Account / Business */}
          <div>
            <h5
              style={{
                fontSize: "14px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "24px",
                }}
            >
              Business
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { href: "/wholesale", label: "Wholesale" },
                { href: "/business", label: "Business Account" },
                { href: "/events", label: "Private Events" },
                { href: "/ai-label-studio", label: "AI Label Studio" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "16px",
                    color: "var(--text-secondary)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider" style={{ margin: 0 }} />

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 0",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
            © {year} {BRAND.name}. All rights reserved. Calgary, AB.
          </p>
          <div className="flex-wrap" style={{ display: "flex", gap: "20px" }}>
            <Link
              href="/faq"
              style={{ fontSize: "16px", color: "var(--text-secondary)", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              style={{ fontSize: "16px", color: "var(--text-secondary)", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.target.style.color = "var(--accent-primary)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
