"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { BUSINESS_CODE_EXPIRY_HOURS } from "@/lib/constants";

export default function AdminBusinessCodesPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    try {
      const res = await fetch("/api/business-codes");
      const data = await res.json();
      setCodes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/business-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate code");
      }
      
      setBusinessName("");
      fetchCodes();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AdminLayout>
      <AdminPageHeader title="Business Codes" subtitle="Generate verification codes for wholesale accounts" />
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
        
        {/* Generator Form */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "24px" }}>
          <h3 style={{ fontSize: "1rem", fontFamily: "'Cormorant Garamond', serif", marginBottom: "16px" }}>Generate New Code</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginBottom: "20px" }}>
            Generate a unique, single-use 6-digit access code for an approved wholesale client. Codes automatically expire after {BUSINESS_CODE_EXPIRY_HOURS} hours.
          </p>
          
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted)", marginBottom: "8px" }}>
                Business Name
              </label>
              <input 
                className="input" 
                placeholder="e.g. ACME Café" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            
            {error && <p style={{ color: "#f87171", fontSize: "0.8rem" }}>{error}</p>}
            
            <button type="submit" disabled={generating} className="btn btn-primary" style={{ marginTop: "8px" }}>
              {generating ? "Generating..." : "Generate Code"}
            </button>
          </form>
        </div>

        {/* Codes List */}
        <div>
          {loading ? (
             <div style={{ padding: "20px", color: "var(--color-muted)" }}>Loading codes...</div>
          ) : codes.length === 0 ? (
            <EmptyState
              icon="🔑"
              title="No codes generated yet"
              message="When you generate business codes, they will appear here so you can copy and email them to the client."
            />
          ) : (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Business</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => {
                    const isExpired = new Date() > new Date(c.expires_at);
                    let statusLabel = "Active";
                    let statusColor = "var(--color-accent)";
                    
                    if (c.is_used) {
                      statusLabel = "Used";
                      statusColor = "var(--color-muted)";
                    } else if (isExpired) {
                      statusLabel = "Expired";
                      statusColor = "#f87171"; // Red
                    }

                    return (
                      <tr key={c.id}>
                        <td>
                          <span style={{ 
                            fontFamily: "monospace", 
                            background: "rgba(0,0,0,0.2)", 
                            padding: "4px 8px", 
                            borderRadius: "4px",
                            letterSpacing: "0.1em",
                            color: "var(--color-cream)"
                          }}>
                            {c.code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{c.business_name}</td>
                        <td>
                          <span style={{ fontSize: "0.75rem", color: statusColor, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                          {new Date(c.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                          {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </AdminLayout>
  );
}
