"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Promo Codes (/admin/promo-codes)
// Create, manage, enable/disable promo codes.
// Codes stored in Supabase promo_codes table.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthHeader } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import * as Icons from "lucide-react";

const EMPTY_FORM = {
  code: "",
  type: "percentage",
  value: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
  case_sensitive: false,
};

function Field({ label, children, hint }) {
  return (
    <div className="promo-field-wrapper" style={{ minWidth: 0, width: "100%" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

export default function AdminPromoCodesPage() {
  const [promos, setPromos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => { loadPromos(); }, []);

  async function loadPromos() {
    setLoading(true);
    setLoadError(null);
    try {
      const authHeader = await getAuthHeader();
      const res  = await fetch("/api/admin/promo-codes", { headers: { ...authHeader } });
      if (!res.ok) throw new Error("Failed to load promo codes");
      const json = await res.json();
      setPromos(json.promoCodes || []);
    } catch (e) {
      console.error("Failed to load promo codes:", e);
      setLoadError("Could not load promo codes. Please refresh to try again.");
    } finally {
      setLoading(false);
    }
  }

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    setFormError("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    setActionError("");

    if (!form.code.trim()) { setFormError("Code is required."); return; }
    if (form.type !== "free_delivery" && (!form.value || parseFloat(form.value) <= 0)) {
      setFormError("Please enter a valid discount value greater than 0."); return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.case_sensitive ? form.code.trim() : form.code.trim().toUpperCase(),
        type: form.type,
        value: form.type === "free_delivery" ? 0 : parseFloat(form.value),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        case_sensitive: form.case_sensitive,
      };

      const authHeader = await getAuthHeader();
      const res  = await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json", ...authHeader }, body: JSON.stringify(payload) });
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Failed to create promo code");

      setShowForm(false);
      setForm(EMPTY_FORM);
      setSuccessMsg(`Promo code "${payload.code}" created successfully!`);
      setTimeout(() => setSuccessMsg(""), 5000);
      loadPromos();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id, currentStatus) {
    setTogglingId(id);
    setActionError("");
    setSuccessMsg("");
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/admin/promo-codes", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader }, body: JSON.stringify({ id, is_active: !currentStatus }) });
      if (!res.ok) throw new Error("Failed to update status");
      loadPromos();
    } catch (e) { 
      console.error(e);
      setActionError("Failed to update promo code status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id, code) {
    if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setActionError("");
    setSuccessMsg("");
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/admin/promo-codes", { method: "DELETE", headers: { "Content-Type": "application/json", ...authHeader }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error("Failed to delete promo code");
      loadPromos();
    } catch (e) { 
      console.error(e); 
      setActionError("Failed to delete promo code.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatValue(promo) {
    if (promo.type === "percentage")    return `${promo.value}% off`;
    if (promo.type === "fixed")         return `$${parseFloat(promo.value).toFixed(2)} off`;
    if (promo.type === "free_delivery") return "Free Delivery";
    return promo.value;
  }

  function formatExpiry(expires_at) {
    if (!expires_at) return "No expiry";
    const d = new Date(expires_at);
    const now = new Date();
    if (d < now) return <span style={{ color: "#ef4444" }}>Expired</span>;
    const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    return <span style={{ color: daysLeft <= 7 ? "#f59e0b" : "var(--text-muted)" }}>{d.toLocaleDateString()} ({daysLeft}d left)</span>;
  }

  return (
    <AdminLayout>
      <div className="promo-page-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <AdminPageHeader title="Promo Codes" subtitle="Manage discount codes that customers can apply at checkout" />
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setFormError(""); setForm(EMPTY_FORM); setSuccessMsg(""); }}
              className="btn btn-primary btn-promo-primary"
            >
              + New Promo Code
            </button>
          )}
        </div>

        {/* Global Feedback Messages */}
        {successMsg && (
          <div style={{ marginBottom: "24px", padding: "16px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "8px", color: "#16a34a", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }} role="status">
            <Icons.CheckCircle size={18} /> {successMsg}
          </div>
        )}
        {actionError && (
          <div style={{ marginBottom: "24px", padding: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#dc2626", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
            <Icons.AlertCircle size={18} /> {actionError}
          </div>
        )}

        {/* Create Form Card */}
        {showForm && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "12px", padding: "24px", marginBottom: "32px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "var(--text-main)" }}>Create Promo Code</h3>
            <p style={{ margin: "0 0 24px", fontSize: "15px", color: "var(--text-muted)" }}>Configure a new discount code for your customers.</p>
            
            <form onSubmit={handleCreate}>
              <div className="promo-form-grid" style={{ marginBottom: "24px" }}>
                <Field label="Code *" hint="What customers type at checkout">
                  <input
                    className="input promo-input"
                    placeholder="e.g. SUMMER10"
                    required
                    value={form.code}
                    onChange={e => setField("code", form.case_sensitive ? e.target.value : e.target.value.toUpperCase())}
                    style={{ letterSpacing: "0.05em", fontWeight: 500 }}
                  />
                </Field>

                <Field label="Discount Type *">
                  <select className="input promo-input" value={form.type} onChange={e => setField("type", e.target.value)}>
                    <option value="percentage">Percentage (%) Off</option>
                    <option value="fixed">Fixed Amount ($) Off</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </Field>

                {form.type !== "free_delivery" ? (
                  <Field label={form.type === "percentage" ? "Discount Percentage (%) *" : "Discount Amount ($) *"} hint={form.type === "percentage" ? "Enter a number from 1 to 100" : "Enter the dollar amount (e.g. 15.00)"}>
                    <input className="input promo-input" type="number" step="0.01" min="0.01" required value={form.value} onChange={e => setField("value", e.target.value)} />
                  </Field>
                ) : (
                  <div className="promo-field-wrapper" style={{ minWidth: 0, width: "100%" }}></div> // Placeholder for grid alignment
                )}

                <Field label="Minimum Order Amount ($)" hint="Subtotal required to use this code">
                  <input className="input promo-input" type="number" step="0.01" min="0" placeholder="No minimum" value={form.min_order_amount} onChange={e => setField("min_order_amount", e.target.value)} />
                </Field>

                <Field label="Maximum Uses" hint="Total times this code can be used across all customers">
                  <input className="input promo-input" type="number" min="1" placeholder="Unlimited uses" value={form.max_uses} onChange={e => setField("max_uses", e.target.value)} />
                </Field>

                <Field label="Expiry Date" hint="Code expires at the end of this day">
                  <input className="input promo-input" type="date" value={form.expires_at} min={new Date().toISOString().split("T")[0]} onChange={e => setField("expires_at", e.target.value)} />
                </Field>
              </div>

              {/* Case Sensitivity Option */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px", padding: "16px", background: "var(--bg-main)", border: "1px solid var(--border-soft)", borderRadius: "8px" }}>
                <input
                  type="checkbox"
                  id="case_sensitive"
                  checked={form.case_sensitive}
                  onChange={e => setField("case_sensitive", e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", marginTop: "2px" }}
                />
                <label htmlFor="case_sensitive" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <strong style={{ fontSize: "16px", color: "var(--text-main)", fontWeight: 600 }}>Require exact letter case</strong>
                  <span style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Leave unchecked to let customers enter the code using uppercase or lowercase letters. (Recommended)
                  </span>
                </label>
              </div>

              {formError && (
                <div style={{ marginBottom: "20px", padding: "14px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", color: "#dc2626", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
                   <Icons.AlertCircle size={18} /> {formError}
                </div>
              )}

              {/* Form Actions */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--border-soft)", paddingTop: "24px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-promo-primary"
                >
                  {saving ? "Creating..." : "Create Promo Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="btn btn-outline btn-promo-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List Section */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
              Loading promo codes...
            </div>
          ) : loadError ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#ef4444", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
              {loadError}
            </div>
          ) : promos.length === 0 ? (
            <EmptyState
              icon={<Icons.Tag size={48} color="var(--border-strong)" />}
              title="No promo codes yet"
              message="Create discount codes to run sales and offer special promotions to your customers."
              action={
                !showForm && (
                  <button onClick={() => setShowForm(true)} className="btn btn-outline" style={{ marginTop: "16px" }}>
                    Create Promo Code
                  </button>
                )
              }
            />
          ) : (
            <>
              {/* Desktop Table (hidden on mobile) */}
              <div className="promo-desktop-table" style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", overflow: "hidden" }}>
                <div className="table-responsive">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                        {["Code", "Discount", "Min Order", "Uses", "Expires", "Status", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {promos.map((promo, i) => (
                        <tr key={promo.id} style={{ borderBottom: i < promos.length - 1 ? "1px solid var(--border-soft)" : "none", transition: "opacity 0.2s", opacity: (togglingId === promo.id || deletingId === promo.id) ? 0.5 : 1 }}>
                          <td style={{ padding: "16px", minWidth: "140px" }}>
                            <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)" }}>{promo.code}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                              {promo.case_sensitive ? "Exact match" : "Any case"}
                            </div>
                          </td>
                          <td style={{ padding: "16px", fontSize: "15px", color: "var(--text-main)", whiteSpace: "nowrap" }}>{formatValue(promo)}</td>
                          <td style={{ padding: "16px", fontSize: "15px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{promo.min_order_amount ? `$${parseFloat(promo.min_order_amount).toFixed(2)}` : "—"}</td>
                          <td style={{ padding: "16px", fontSize: "15px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {promo.times_used || 0}
                            {promo.max_uses ? ` / ${promo.max_uses}` : ` / ∞`}
                          </td>
                          <td style={{ padding: "16px", fontSize: "15px", whiteSpace: "nowrap" }}>{formatExpiry(promo.expires_at)}</td>
                          <td style={{ padding: "16px" }}>
                            <StatusBadge status={promo.is_active ? "Active" : "Inactive"} />
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <button
                                onClick={() => handleToggle(promo.id, promo.is_active)}
                                disabled={togglingId === promo.id || deletingId === promo.id}
                                className="btn btn-ghost"
                                style={{ padding: "6px 12px", fontSize: "14px", height: "auto" }}
                              >
                                {promo.is_active ? "Disable" : "Enable"}
                              </button>
                              <button
                                onClick={() => handleDelete(promo.id, promo.code)}
                                disabled={togglingId === promo.id || deletingId === promo.id}
                                className="promo-delete-btn"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards (hidden on desktop) */}
              <div className="promo-mobile-cards">
                {promos.map((promo) => (
                  <div key={promo.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", opacity: (togglingId === promo.id || deletingId === promo.id) ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--text-main)" }}>{promo.code}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {formatValue(promo)}
                        </div>
                      </div>
                      <StatusBadge status={promo.is_active ? "Active" : "Inactive"} />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "14px", color: "var(--text-muted)", background: "var(--bg-main)", padding: "12px", borderRadius: "6px" }}>
                      <div>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Min Order</div>
                        <div style={{ color: "var(--text-main)" }}>{promo.min_order_amount ? `$${parseFloat(promo.min_order_amount).toFixed(2)}` : "None"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Usage</div>
                        <div style={{ color: "var(--text-main)" }}>{promo.times_used || 0} {promo.max_uses ? `/ ${promo.max_uses}` : `/ ∞`}</div>
                      </div>
                      <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Expiry</div>
                        <div style={{ color: "var(--text-main)" }}>{formatExpiry(promo.expires_at)}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "4px" }}>
                      <button
                        onClick={() => handleDelete(promo.id, promo.code)}
                        disabled={togglingId === promo.id || deletingId === promo.id}
                        className="promo-delete-btn"
                        style={{ padding: "6px 12px", fontSize: "14px", height: "auto" }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleToggle(promo.id, promo.is_active)}
                        disabled={togglingId === promo.id || deletingId === promo.id}
                        className="btn btn-outline"
                        style={{ padding: "6px 16px", fontSize: "14px", height: "auto" }}
                      >
                        {promo.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Primary Brown Button Override */
        .btn-promo-primary {
          background-color: var(--accent, #B89B5E) !important;
          border-color: var(--accent, #B89B5E) !important;
          color: #FAF8F3 !important;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, filter 0.2s ease !important;
          font-size: clamp(15px, 1.5vw, 16px) !important;
          padding: 10px 20px !important;
          height: auto !important;
        }
        
        .btn-promo-primary:hover:not(:disabled) {
          filter: brightness(0.9) !important; /* Brown-darkened hover */
        }
        
        .btn-promo-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .btn-promo-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-promo-secondary {
          font-size: clamp(15px, 1.5vw, 16px) !important;
          padding: 10px 20px !important;
          height: auto !important;
        }

        /* Form Inputs */
        .promo-input {
          height: 48px !important;
          padding: 0 16px !important;
          font-size: clamp(16px, 1.5vw, 17px) !important;
          line-height: 1.5 !important;
        }

        /* Form Grid - Explicit Responsive Breakpoints */
        .promo-form-grid {
          display: grid;
          gap: 20px;
        }

        /* Desktop: 3 columns */
        @media (min-width: 1200px) {
          .promo-form-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Tablet: 2 columns */
        @media (min-width: 768px) and (max-width: 1199px) {
          .promo-form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Mobile: 1 column */
        @media (max-width: 767px) {
          .promo-form-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Delete Button Action */
        .promo-delete-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .promo-delete-btn:hover:not(:disabled), .promo-delete-btn:focus-visible {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
          outline: none;
        }

        .promo-delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive List Display */
        .promo-desktop-table {
          display: block;
        }
        .promo-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 16px;
        }

        @media (max-width: 767px) {
          .promo-desktop-table {
            display: none;
          }
          .promo-mobile-cards {
            display: flex;
          }
        }
      `}} />
    </AdminLayout>
  );
}