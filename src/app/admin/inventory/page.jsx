"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Inventory (/admin/inventory)
//
// Stock = produced (from batches) minus committed (from orders).
// Admin enters batches only. Remaining is always calculated.
//
// Phase 7: getBatches(), createBatch(), updateBatch(), deleteBatch()
//          are now async Supabase calls. Page uses useEffect to load data.
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormField from "@/components/admin/AdminFormField";
import ConfirmModal from "@/components/admin/ConfirmModal";
import {
  getBatches, createBatch, updateBatch, deleteBatch,
  calculateStock, BATCH_FLAVOURS, BATCH_SIZES, BATCH_CATEGORIES,
  STOCK_THRESHOLD_LOW,
} from "@/lib/admin-inventory";
import { getCommittedItems } from "@/lib/admin-order-items";

// ── Helpers ──────────────────────────────────

function stockBadge(status) {
  const map = {
    OK:  { bg: "rgba(74,222,128,0.1)",  color: "#4ade80",  border: "rgba(74,222,128,0.25)"  },
    Low: { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24",  border: "rgba(251,191,36,0.25)"  },
    Out: { bg: "rgba(239,68,68,0.1)",   color: "#f87171",  border: "rgba(239,68,68,0.25)"   },
  };
  const s = map[status] || map.OK;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "3px",
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${accent ? "rgba(201,169,110,0.3)" : "var(--border)"}`,
      borderRadius: "6px",
      padding: "20px 22px",
    }}>
      <p style={{
        fontSize: "14px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-muted)",
        margin: "0 0 6px",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "14px",
        fontWeight: 600,
        color: accent ? "var(--color-accent)" : "var(--color-cream)",
        lineHeight: "100%",
        margin: 0,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "14px", color: "var(--color-muted)", marginTop: "4px", margin: "4px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  flavour:     BATCH_FLAVOURS[0],
  size:        "250ml",
  category:    "cake",
  qtyProduced: "",
  bakeDate:    "",
  expiryDate:  "",
  notes:       "",
};

// ── Page ─────────────────────────────────────

export default function AdminInventoryPage() {
  const [batches,      setBatches]      = useState([]);
  const [stockData,    setStockData]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

  // ── Load data from Supabase on mount ──
  const refreshData = useCallback(async () => {
    setLoading(true);
    const [b, committed] = await Promise.all([getBatches(), getCommittedItems()]);
    setBatches(b);
    setStockData(calculateStock(b, committed));
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(batch) {
    setForm({
      flavour:     batch.flavour,
      size:        batch.size,
      category:    batch.category,
      qtyProduced: String(batch.qtyProduced),
      bakeDate:    batch.bakeDate,
      expiryDate:  batch.expiryDate,
      notes:       batch.notes,
    });
    setEditTarget(batch);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  function handleField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, qtyProduced: Number(form.qtyProduced) };
    if (editTarget) {
      await updateBatch(editTarget.id, data);
      showToast("Batch updated.");
    } else {
      await createBatch(data);
      showToast("Batch added.");
    }
    await refreshData();
    setSaving(false);
    closeForm();
  }

  async function handleDelete() {
    setSaving(true);
    await deleteBatch(deleteTarget.id);
    setDeleteTarget(null);
    showToast("Batch deleted.");
    await refreshData();
    setSaving(false);
  }

  // ── Derived values ──
  const totalProduced  = stockData.reduce((s, r) => s + r.totalProduced, 0);
  const totalCommitted = stockData.reduce((s, r) => s + r.committed, 0);
  const totalAvailable = stockData.reduce((s, r) => s + r.available, 0);
  const lowCount       = stockData.filter((r) => r.status !== "OK").length;
  const hasAlerts      = stockData.some((r) => r.status !== "OK");

  return (
    <AdminLayout
      title="Inventory"
      subtitle={
        loading
          ? "Loading…"
          : `${totalAvailable} units available across ${batches.length} batches`
      }
      actions={
        <button
          className="btn btn-primary btn-sm"
          onClick={openAdd}
          disabled={loading}
          style={{ fontSize: "16px" }}
        >
          + Add Batch
        </button>
      }
    >
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: "16px", right: "20px", zIndex: 9999,
          padding: "10px 18px",
          background: "rgba(74,222,128,0.12)",
          border: "1px solid rgba(74,222,128,0.3)",
          borderRadius: "4px",
          color: "#4ade80",
          fontSize: "16px",
          animation: "fadeIn 0.2s ease",
        }}>
          ✓ {toast}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "260px",
          gap: "12px",
          color: "var(--color-muted)",
        }}>
          <div style={{
            width: "28px",
            height: "28px",
            border: "2px solid var(--border)",
            borderTopColor: "var(--color-accent)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }} />
          <span style={{ fontSize: "16px" }}>Loading inventory…</span>
        </div>
      ) : (
        <>
          {/* ── Alert banner ── */}
          {hasAlerts && (
            <div style={{
              marginBottom: "24px",
              padding: "12px 16px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "4px",
              fontSize: "16px",
              color: "#f87171",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}>
              <span style={{ flexShrink: 0, marginTop: "1px" }}>⚠</span>
              <span>
                {lowCount} flavour{lowCount > 1 ? "s" : ""} need attention:{" "}
                {stockData.filter((r) => r.status !== "OK").map((r) => `${r.flavour} ${r.size}`).join(" · ")}
              </span>
            </div>
          )}

          {/* ── Summary cards ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px",
            marginBottom: "32px",
          }}>
            <SummaryCard label="Total Produced"  value={totalProduced}  sub="all batches" />
            <SummaryCard label="Committed"       value={totalCommitted} sub="orders in progress" />
            <SummaryCard label="Available Stock" value={totalAvailable} sub="ready to sell" accent />
            <SummaryCard label="Needs Attention" value={lowCount}       sub="low or out of stock" />
          </div>

          {/* ── Stock Summary table ── */}
          <Section title="Stock by Flavour & Size">
            <div className="table-responsive">
<table className="table">
              <thead>
                <tr>
                  <th>Flavour</th>
                  <th>Size</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Produced</th>
                  <th style={{ textAlign: "right" }}>Committed</th>
                  <th style={{ textAlign: "right" }}>Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--color-muted)", padding: "40px" }}>
                      No inventory yet. Add a batch to get started.
                    </td>
                  </tr>
                ) : (
                  stockData.map((row) => (
                    <tr key={`${row.flavour}-${row.size}-${row.category}`}>
                      <td style={{ fontWeight: 500 }}>{row.flavour}</td>
                      <td style={{ color: "var(--color-sand)" }}>{row.size}</td>
                      <td style={{ color: "var(--color-muted)", textTransform: "capitalize" }}>{row.category}</td>
                      <td style={{ textAlign: "right" }}>{row.totalProduced}</td>
                      <td style={{ textAlign: "right", color: "var(--color-sand)" }}>{row.committed}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: row.status === "OK" ? "var(--color-cream)" : "#fbbf24" }}>
                        {row.available}
                      </td>
                      <td>{stockBadge(row.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
</div>
          </Section>

          {/* ── Batch History table ── */}
          <Section title="Batch History" style={{ marginTop: "28px" }}>
            <div className="table-responsive">
<table className="table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Flavour</th>
                  <th>Size</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Produced</th>
                  <th>Bake Date</th>
                  <th>Expiry</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--color-muted)", padding: "40px" }}>
                      No batches recorded.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id}>
                      <td style={{ color: "var(--color-accent)", fontSize: "16px", }}>
                        {b.id.slice(0, 8)}…
                      </td>
                      <td style={{ fontWeight: 500 }}>{b.flavour}</td>
                      <td style={{ color: "var(--color-sand)" }}>{b.size}</td>
                      <td style={{ color: "var(--color-muted)", textTransform: "capitalize" }}>{b.category}</td>
                      <td style={{ textAlign: "right" }}>{b.qtyProduced}</td>
                      <td style={{ color: "var(--color-sand)", fontSize: "16px" }}>{b.bakeDate}</td>
                      <td style={{ color: "var(--color-muted)", fontSize: "16px" }}>{b.expiryDate}</td>
                      <td style={{ color: "var(--color-muted)", fontSize: "16px", maxWidth: "180px" }}>
                        {b.notes || "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <ActionBtn onClick={() => openEdit(b)}>Edit</ActionBtn>
                          <ActionBtn danger onClick={() => setDeleteTarget(b)}>Delete</ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
</div>
            <p style={{ margin: "10px 0 0", fontSize: "14px", color: "var(--color-muted)" }}>
              Stock is calculated: Produced − Committed orders. Changes when order statuses update.
            </p>
          </Section>
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="overlay" onClick={closeForm}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "32px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "fadeIn 0.2s ease both",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h4 style={{ margin: 0, fontSize: "24px" }}>
                {editTarget ? "Edit Batch" : "Add Batch"}
              </h4>
              <button onClick={closeForm}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", fontSize: "24px", lineHeight: "100%" }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Row 1: flavour + size */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <AdminFormField label="Flavour" required>
                  <select className="input" value={form.flavour}
                    onChange={(e) => handleField("flavour", e.target.value)}>
                    {BATCH_FLAVOURS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Size" required>
                  <select className="input" value={form.size}
                    onChange={(e) => handleField("size", e.target.value)}>
                    {BATCH_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </AdminFormField>
              </div>

              {/* Row 2: category + qty produced */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <AdminFormField label="Category" required>
                  <select className="input" value={form.category}
                    onChange={(e) => handleField("category", e.target.value)}>
                    {BATCH_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Qty Produced" required hint="Available stock is auto-calculated from this">
                  <input className="input" type="number" min="1" required
                    value={form.qtyProduced}
                    placeholder="e.g. 24"
                    onChange={(e) => handleField("qtyProduced", e.target.value)}
                  />
                </AdminFormField>
              </div>

              {/* Row 3: dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <AdminFormField label="Bake Date" required>
                  <input className="input" type="date" required
                    value={form.bakeDate}
                    onChange={(e) => handleField("bakeDate", e.target.value)}
                  />
                </AdminFormField>
                <AdminFormField label="Expiry / Best Before" required>
                  <input className="input" type="date" required
                    value={form.expiryDate}
                    onChange={(e) => handleField("expiryDate", e.target.value)}
                  />
                </AdminFormField>
              </div>

              {/* Notes */}
              <AdminFormField label="Notes">
                <textarea className="input" rows={2}
                  value={form.notes}
                  placeholder="Optional batch notes…"
                  onChange={(e) => handleField("notes", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "6px" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Batch"
        message={`Delete batch for ${deleteTarget?.flavour} ${deleteTarget?.size} (${deleteTarget?.qtyProduced} units)? This cannot be undone.`}
        confirmLabel="Delete Batch"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Spinner keyframe ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}

// ── Mini sub-components ───────────────────────

function Section({ title, children, style: extraStyle }) {
  return (
    <div style={{ marginTop: "0", ...extraStyle }}>
      <h3 style={{
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--color-muted)",
        margin: "0 0 10px",
      }}>
        {title}
      </h3>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        overflow: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

function ActionBtn({ children, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 10px",
        fontSize: "14px",
        background: "transparent",
        border: `1px solid ${danger ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
        borderRadius: "3px",
        color: danger ? "#f87171" : "var(--color-sand)",
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? "#f87171" : "var(--color-sand)";
        e.currentTarget.style.color = danger ? "#fca5a5" : "var(--color-cream)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = danger ? "rgba(239,68,68,0.3)" : "var(--border)";
        e.currentTarget.style.color = danger ? "#f87171" : "var(--color-sand)";
      }}
    >
      {children}
    </button>
  );
}
