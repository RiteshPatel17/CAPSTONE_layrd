"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Promo Codes (/admin/promo-codes)
// Create, manage, enable/disable promo codes.
// Codes stored in Supabase promo_codes table.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

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
    <div>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: "14px", color: "var(--color-muted)", marginTop: "4px" }}>{hint}</p>}
    </div>
  );
}

export default function AdminPromoCodesPage() {
  const [promos, setPromos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { loadPromos(); }, []);

  async function loadPromos() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/promo-codes");
      const json = await res.json();
      setPromos(json.promoCodes || []);
    } catch (e) {
      console.error("Failed to load promo codes:", e);
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

    if (!form.code.trim()) { setFormError("Code is required."); return; }
    if (form.type !== "free_delivery" && (!form.value || parseFloat(form.value) <= 0)) {
      setFormError("Please enter a valid discount value."); return;
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

      const res  = await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Failed to create promo code");

      setShowForm(false);
      setForm(EMPTY_FORM);
      setSuccessMsg(`Promo code "${payload.code}" created!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      loadPromos();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id, currentStatus) {
    try {
      await fetch("/api/admin/promo-codes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_active: !currentStatus }) });
      loadPromos();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id, code) {
    if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    try {
      await fetch("/api/admin/promo-codes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      loadPromos();
    } catch (e) { console.error(e); }
  }

  function formatValue(promo) {
    if (promo.type === "percentage")    return `${promo.value}% off`;
    if (promo.type === "fixed")         return `$${promo.value} off`;
    if (promo.type === "free_delivery") return "Free Delivery";
    return promo.value;
  }

  function formatExpiry(expires_at) {
    if (!expires_at) return "No expiry";
    const d = new Date(expires_at);
    const now = new Date();
    if (d < now) return <span style={{ color: "#f87171" }}>Expired {d.toLocaleDateString()}</span>;
    const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    return <span style={{ color: daysLeft <= 7 ? "#fb923c" : "inherit" }}>{d.toLocaleDateString()} ({daysLeft}d left)</span>;
  }

  return (
    <AdminLayout title="Promo Codes" subtitle="Create and manage discount codes">

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "var(--text-main)" }}>Promo Codes</h2>
          <p style={{ margin: "2px 0 0", fontSize: "16px", color: "var(--text-muted)" }}>Manage discount codes that customers can apply at checkout</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); setForm(EMPTY_FORM); }}
          style={{ padding: "9px 18px", background: showForm ? "transparent" : "var(--color-accent)", color: showForm ? "var(--text-muted)" : "var(--color-black)", border: showForm ? "1px solid var(--border)" : "none", borderRadius: "4px", fontSize: "16px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em" }}
        >
          {showForm ? "Cancel" : "+ New Promo Code"}
        </button>
      </div>

      {successMsg && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "4px", color: "#4ade80", fontSize: "16px" }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "6px", padding: "28px 28px 24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: 600, color: "var(--text-main)" }}>Create New Promo Code</h3>
          <form onSubmit={handleCreate}>
            <div className="responsive-grid-3" style={{ gap: "16px", marginBottom: "20px" }}>

              <Field label="Code *" hint="What customers type at checkout">
                <input
                  className="input"
                  placeholder="e.g. SUMMER10"
                  required
                  value={form.code}
                  onChange={e => setField("code", form.case_sensitive ? e.target.value : e.target.value.toUpperCase())}
                  style={{ letterSpacing: "0.08em" }}
                />
              </Field>

              <Field label="Discount Type *">
                <select className="input" value={form.type} onChange={e => setField("type", e.target.value)}>
                  <option value="percentage">Percentage (%) Off</option>
                  <option value="fixed">Fixed Amount ($) Off</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </Field>

              {form.type !== "free_delivery" && (
                <Field label={form.type === "percentage" ? "Discount % *" : "Discount Amount ($) *"} hint={form.type === "percentage" ? "e.g. 10 for 10% off" : "e.g. 5 for $5 off"}>
                  <input className="input" type="number" step="0.01" min="0.01" required value={form.value} onChange={e => setField("value", e.target.value)} />
                </Field>
              )}

              <Field label="Min Order Amount ($)" hint="Minimum subtotal to use this code">
                <input className="input" type="number" step="0.01" min="0" placeholder="No minimum" value={form.min_order_amount} onChange={e => setField("min_order_amount", e.target.value)} />
              </Field>

              <Field label="Max Uses" hint="Leave blank for unlimited uses">
                <input className="input" type="number" min="1" placeholder="Unlimited" value={form.max_uses} onChange={e => setField("max_uses", e.target.value)} />
              </Field>

              <Field label="Expiry Date" hint="Leave blank for no expiry">
                <input className="input" type="date" value={form.expires_at} min={new Date().toISOString().split("T")[0]} onChange={e => setField("expires_at", e.target.value)} />
              </Field>

            </div>

            {/* Case sensitivity toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "12px 16px", background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.15)", borderRadius: "4px" }}>
              <input
                type="checkbox"
                id="case_sensitive"
                checked={form.case_sensitive}
                onChange={e => setField("case_sensitive", e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label htmlFor="case_sensitive" style={{ cursor: "pointer", fontSize: "16px", color: "var(--text-main)" }}>
                <strong>Case-sensitive code</strong>
                <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>
                  {form.case_sensitive
                    ? "Code will be stored exactly as typed (e.g. \"Summer10\" ≠ \"SUMMER10\")"
                    : "Code will be stored as UPPERCASE — customers can type it in any case (recommended)"}
                </span>
              </label>
            </div>

            {formError && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "4px", color: "#f87171", fontSize: "16px" }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ padding: "10px 24px", background: saving ? "rgba(201,169,110,0.4)" : "var(--color-accent)", color: "var(--color-black)", border: "none", borderRadius: "4px", fontWeight: 600, fontSize: "16px", letterSpacing: "0.08em", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Create Promo Code"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "6px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading promo codes...</div>
        ) : promos.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🏷️</div>
            <p style={{ margin: 0 }}>No promo codes yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="table-responsive">
<table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                {["Code", "Discount", "Min Order", "Uses", "Expires", "Case", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map((promo, i) => (
                <tr key={promo.id} style={{ borderBottom: i < promos.length - 1 ? "1px solid var(--border-soft)" : "none", opacity: promo.is_active ? 1 : 0.55 }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontWeight: 700, fontSize: "20px", color: "var(--color-accent)", letterSpacing: "0.06em" }}>{promo.code}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "16px", color: "var(--text-main)" }}>{formatValue(promo)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "16px", color: "var(--text-muted)" }}>{promo.min_order_amount ? `$${parseFloat(promo.min_order_amount).toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "16px", color: "var(--text-muted)" }}>
                    {promo.times_used || 0}
                    {promo.max_uses ? <span> / {promo.max_uses}</span> : <span style={{ fontSize: "14px" }}> ∞</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "16px" }}>{formatExpiry(promo.expires_at)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "16px", color: "var(--text-muted)" }}>
                    {promo.case_sensitive ? "🔒 Exact" : "🔤 Any case"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleToggle(promo.id, promo.is_active)}
                      style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "1px solid", background: promo.is_active ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", color: promo.is_active ? "#4ade80" : "#f87171", borderColor: promo.is_active ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)" }}
                    >
                      {promo.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleDelete(promo.id, promo.code)}
                      style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "16px", padding: "4px 8px", borderRadius: "3px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        )}
      </div>
    </AdminLayout>
  );
}
