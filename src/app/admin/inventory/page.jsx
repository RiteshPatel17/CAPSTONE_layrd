"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";
import AdminFormField from "@/components/admin/AdminFormField";
import ConfirmModal from "@/components/admin/ConfirmModal";
import {
  getBatches, createBatch, updateBatch, deleteBatch,
} from "@/lib/admin-inventory";
import {
  calculateStock, BATCH_FLAVOURS, BATCH_SIZES, BATCH_CATEGORIES,
} from "@/lib/inventory-options";
import { getCommittedItems } from "@/lib/admin-order-items";

function stockBadge(status) {
  const map = {
    OK:  { bg: "rgba(74,222,128,0.1)",  color: "#4ade80",  border: "rgba(74,222,128,0.25)"  },
    Low: { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24",  border: "rgba(251,191,36,0.25)"  },
    Out: { bg: "rgba(239,68,68,0.1)",   color: "#f87171",  border: "rgba(239,68,68,0.25)"   },
  };
  const s = map[status] || map.OK;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "3px",
      fontSize: "14px", fontWeight: 600, letterSpacing: "0.08em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
}

function isBatchExpired(expiryDate) {
  if (!expiryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return expiry < today;
}

function expiryCell(expiryDate) {
  if (!expiryDate) return "—";
  if (!isBatchExpired(expiryDate)) {
    return <span style={{ color: "var(--color-muted)", fontSize: "16px" }}>{expiryDate}</span>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ color: "var(--color-muted)", fontSize: "16px" }}>{expiryDate}</span>
      <span style={{
        display: "inline-block", padding: "2px 8px", borderRadius: "3px",
        fontSize: "13px", fontWeight: 600, letterSpacing: "0.05em",
        background: "rgba(239,68,68,0.1)", color: "#f87171",
        border: "1px solid rgba(239,68,68,0.25)", textTransform: "uppercase", width: "fit-content"
      }}>
        Expired
      </span>
    </div>
  );
}

function InventoryKpiCard({ label, value, sub, accentColor, icon }) {
  return (
    <div className="inventory-kpi-card" style={{
      background: "var(--bg-card)",
      border: `1px solid var(--border-soft)`,
      borderTop: `3px solid ${accentColor || "var(--border)"}`,
      borderRadius: "6px",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <p style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>
          {label}
        </p>
        <div style={{ color: accentColor || "var(--text-muted)", opacity: 0.8 }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-main)", lineHeight: "1", margin: "auto 0 6px" }}>
        {value}
      </p>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
        {sub}
      </p>
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

// Server Actions can't read the browser's session automatically, so we
// fetch the current access token here and pass it explicitly into every
// admin-inventory.js / admin-order-items.js call — see requireAdmin() in
// admin-server-auth.js for why.
async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function AdminInventoryPage() {
  const [batches,      setBatches]      = useState([]);
  const [stockData,    setStockData]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState(null);
  
  // UI State
  const [saving,       setSaving]       = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);
  const [errorAlert,   setErrorAlert]   = useState(null);

  // Filter State
  const [stockSearch, setStockSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStatus, setBatchStatus] = useState("All");
  const [batchSort, setBatchSort] = useState("Newest first");
  const [isBatchHistoryOpen, setIsBatchHistoryOpen] = useState(false);

  // Accessibility Refs
  const modalRef = useRef(null);
  const lastActiveElement = useRef(null);

  // ── Load data from Supabase on mount ──
  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await getAccessToken();
      const [b, committed] = await Promise.all([getBatches(token), getCommittedItems(token)]);
      setBatches(b);
      setStockData(calculateStock(b, committed));
    } catch (err) {
      setLoadError("Failed to load inventory data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Modal Accessibility ──
  useEffect(() => {
    if (showForm) {
      lastActiveElement.current = document.activeElement;
      if (modalRef.current) modalRef.current.focus();
    } else {
      if (lastActiveElement.current) lastActiveElement.current.focus();
    }
  }, [showForm]);

  function handleModalKeyDown(e) {
    if (e.key === "Escape" && !saving) {
      closeForm();
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function showError(msg) {
    setErrorAlert(msg);
    setTimeout(() => setErrorAlert(null), 7000);
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
    setIsBatchHistoryOpen(true);
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
    if (saving) return;
    setSaving(true);
    const data = { ...form, qtyProduced: Number(form.qtyProduced) };
    try {
      const token = await getAccessToken();
      if (editTarget) {
        await updateBatch(token, editTarget.id, data);
        showToast("Batch updated successfully.");
      } else {
        await createBatch(token, data);
        showToast("Batch added successfully.");
      }
      await refreshData();
      closeForm();
    } catch (err) {
      showError(err.message || "Failed to save batch.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    setSaving(true);
    try {
      const token = await getAccessToken();
      await deleteBatch(token, deleteTarget.id);
      showToast("Batch deleted successfully.");
      setDeleteTarget(null);
      await refreshData();
    } catch (err) {
      showError(err.message || "Failed to delete batch.");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  function clearBatchFilters() {
    setBatchSearch("");
    setBatchStatus("All");
    setBatchSort("Newest first");
  }

  // ── Derived Data & Filtering ──
  // KPIs
  const totalProduced  = loadError ? 0 : stockData.reduce((s, r) => s + r.totalProduced, 0);
  const totalCommitted = loadError ? 0 : stockData.reduce((s, r) => s + r.committed, 0);
  const totalAvailable = loadError ? 0 : stockData.reduce((s, r) => s + r.available, 0);
  const lowCount       = loadError ? 0 : stockData.filter((r) => r.status !== "OK").length;
  const hasAlerts      = lowCount > 0;
  
  const expiredCount = batches.filter(b => isBatchExpired(b.expiryDate)).length;

  // Stock Filter
  const filteredStock = useMemo(() => {
    if (!stockSearch.trim()) return stockData;
    const q = stockSearch.toLowerCase();
    return stockData.filter(r => 
      r.flavour.toLowerCase().includes(q) || 
      r.size.toLowerCase().includes(q) || 
      r.category.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  }, [stockData, stockSearch]);

  // Batch Filter & Sort
  const filteredBatches = useMemo(() => {
    let result = batches.filter(b => {
      // Search
      if (batchSearch) {
        const q = batchSearch.toLowerCase();
        const matches = (b.id && b.id.toLowerCase().includes(q)) || 
                        (b.flavour && b.flavour.toLowerCase().includes(q)) || 
                        (b.notes && b.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status
      if (batchStatus === "Active") return !isBatchExpired(b.expiryDate);
      if (batchStatus === "Expired") return isBatchExpired(b.expiryDate);
      return true;
    });

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.bakeDate).getTime() || 0;
      const dateB = new Date(b.bakeDate).getTime() || 0;
      const expA = new Date(a.expiryDate).getTime() || Infinity;
      const expB = new Date(b.expiryDate).getTime() || Infinity;

      switch (batchSort) {
        case "Oldest first": return dateA - dateB;
        case "Expiry soonest": return expA - expB;
        case "Expiry latest": return expB - expA;
        case "Newest first":
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [batches, batchSearch, batchStatus, batchSort]);

  // Icons for KPIs
  const IconBox = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
  const IconLock = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
  const IconCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>;
  const IconAlert = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

  return (
    <AdminLayout>
      {/* ── Internal Page Header ── */}
      <div className="inventory-page-header" style={{
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
        gap: "16px", marginBottom: "32px", paddingTop: "8px"
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>Inventory</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "15px" }}>
            {loading ? "Loading inventory data..." : loadError ? "Failed to load data" : `${totalAvailable} units available across ${batches.length} batches`}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openAdd}
          disabled={loading || !!loadError}
          style={{ padding: "10px 20px", fontSize: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}
        >
          + Add Batch
        </button>
      </div>

      {/* ── Notifications / Alerts ── */}
      {toast && (
        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", padding: "12px 16px", borderRadius: "6px", fontSize: "14px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }} role="status" aria-live="polite">
          <IconCheck /> {toast}
        </div>
      )}
      {errorAlert && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "12px 16px", borderRadius: "6px", fontSize: "14px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
          <IconAlert /> {errorAlert}
        </div>
      )}
      {loadError && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "16px", borderRadius: "6px", fontSize: "15px", marginBottom: "32px" }}>
          {loadError}
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", gap: "16px", color: "var(--text-muted)" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-soft)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "15px" }}>Loading operational stock...</span>
        </div>
      ) : !loadError && (
        <>
          {/* ── Needs Attention Banner ── */}
          {hasAlerts && (
            <div style={{ marginBottom: "24px", padding: "14px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", fontSize: "15px", color: "#ef4444", display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ marginTop: "2px" }}><IconAlert /></div>
              <div style={{ lineHeight: "1.5" }}>
                <strong>{lowCount} flavour{lowCount > 1 ? "s" : ""} need attention:</strong>{" "}
                {stockData.filter((r) => r.status !== "OK").map((r) => `${r.flavour} ${r.size}`).join(" · ")}
              </div>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="inventory-kpi-grid" style={{ marginBottom: "40px" }}>
            <InventoryKpiCard label="Total Produced"  value={totalProduced}  sub="Across all batches" icon={<IconBox/>} accentColor="var(--text-muted)" />
            <InventoryKpiCard label="Committed"       value={totalCommitted} sub="Locked by orders" icon={<IconLock/>} accentColor="var(--text-muted)" />
            <InventoryKpiCard label="Available Stock" value={totalAvailable} sub="Ready to sell" icon={<IconCheck/>} accentColor="#4ade80" />
            <InventoryKpiCard label="Needs Attention" value={lowCount}       sub="Low or out of stock" icon={<IconAlert/>} accentColor={hasAlerts ? "#ef4444" : "var(--text-muted)"} />
          </div>

          {/* ── Stock Summary Table ── */}
          <div className="inventory-stock-section" style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--text-main)" }}>Stock by Flavour & Size</h2>
              <input 
                type="text"
                placeholder="Search stock..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="input"
                style={{ padding: "8px 12px", width: "100%", maxWidth: "300px", margin: 0 }}
              />
            </div>
            
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div className="table-responsive" style={{ overflowX: "auto", margin: 0, border: "none" }}>
                <table className="table" style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                    <tr>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Flavour</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Size</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Produced</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Committed</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 20px" }}>
                          {stockData.length === 0 ? "No inventory records yet. Add a batch to get started." : "No stock matches your search."}
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((row) => (
                        <tr key={`${row.flavour}-${row.size}-${row.category}`} className="inventory-table-row">
                          <td style={{ padding: "14px 20px", fontWeight: 600, borderBottom: "1px solid var(--border-soft)" }}>{row.flavour}</td>
                          <td style={{ padding: "14px 20px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-soft)" }}>{row.size}</td>
                          <td style={{ padding: "14px 20px", color: "var(--text-muted)", textTransform: "capitalize", borderBottom: "1px solid var(--border-soft)" }}>{row.category}</td>
                          <td style={{ padding: "14px 20px", textAlign: "right", borderBottom: "1px solid var(--border-soft)" }}>{row.totalProduced}</td>
                          <td style={{ padding: "14px 20px", textAlign: "right", color: "var(--text-muted)", borderBottom: "1px solid var(--border-soft)" }}>{row.committed}</td>
                          <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, fontSize: "15px", borderBottom: "1px solid var(--border-soft)", color: row.status === "OK" ? "var(--text-main)" : "#fbbf24" }}>
                            {row.available}
                          </td>
                          <td style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)" }}>{stockBadge(row.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Batch History Accordion ── */}
          <div className="inventory-batch-history" style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "32px", paddingBottom: "60px" }}>
            <button
              onClick={() => setIsBatchHistoryOpen(!isBatchHistoryOpen)}
              aria-expanded={isBatchHistoryOpen}
              aria-controls="batch-history-content"
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px",
                padding: "16px 20px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                transition: "background 0.2s"
              }}
              className="inventory-accordion-btn"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--text-main)" }}>Batch History</h2>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  — {batches.length} batches {expiredCount > 0 && `· ${expiredCount} expired`}
                </span>
              </div>
              <div style={{ color: "var(--text-muted)", transform: isBatchHistoryOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </button>

            {isBatchHistoryOpen && (
              <div id="batch-history-content" style={{ marginTop: "24px", animation: "fadeIn 0.3s ease" }}>
                {/* Batch Filters */}
                <div className="inventory-batch-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                  <input 
                    type="text" placeholder="Search batch ID, flavour, notes..." 
                    value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)}
                    className="input" style={{ flex: "1 1 200px", margin: 0 }}
                  />
                  <select className="input" value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} style={{ flex: "1 1 120px", margin: 0 }}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                  <select className="input" value={batchSort} onChange={(e) => setBatchSort(e.target.value)} style={{ flex: "1 1 140px", margin: 0 }}>
                    <option value="Newest first">Newest first</option>
                    <option value="Oldest first">Oldest first</option>
                    <option value="Expiry soonest">Expiry soonest</option>
                    <option value="Expiry latest">Expiry latest</option>
                  </select>
                  {(batchSearch || batchStatus !== "All" || batchSort !== "Newest first") && (
                    <button className="btn btn-ghost" onClick={clearBatchFilters} style={{ height: "48px" }}>Clear Filters</button>
                  )}
                </div>
                
                <div style={{ marginBottom: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                  Showing {filteredBatches.length} of {batches.length} batches
                </div>

                {/* Batch Table */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", overflow: "hidden" }}>
                  <div className="table-responsive" style={{ overflowX: "auto", margin: 0, border: "none" }}>
                    <table className="table" style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse" }}>
                      <thead style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                        <tr>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Batch ID</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Flavour</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Size</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Category</th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Produced</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Bake Date</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Expiry</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Notes</th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBatches.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
                              {batches.length === 0 ? "No batches recorded." : "No batches match your filters."}
                            </td>
                          </tr>
                        ) : (
                          filteredBatches.map((b) => (
                            <tr key={b.id} className="inventory-table-row">
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", color: "var(--text-muted)", fontSize: "13px", fontFamily: "monospace" }}>{b.id.slice(0, 8)}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", fontWeight: 500 }}>{b.flavour}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", color: "var(--text-muted)" }}>{b.size}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", color: "var(--text-muted)", textTransform: "capitalize" }}>{b.category}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", textAlign: "right", fontWeight: 600 }}>{b.qtyProduced}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", color: "var(--text-muted)", fontSize: "14px" }}>{b.bakeDate}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)" }}>{expiryCell(b.expiryDate)}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", color: "var(--text-muted)", fontSize: "14px", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.notes}>
                                {b.notes || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                  <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px", fontSize: "13px" }} onClick={() => openEdit(b)}>Edit</button>
                                  <button className="btn btn-danger btn-sm" style={{ padding: "4px 10px", fontSize: "13px" }} onClick={() => setDeleteTarget(b)}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div
            ref={modalRef}
            tabIndex={-1}
            onKeyDown={handleModalKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-soft)",
              borderRadius: "8px",
              padding: "24px",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "fadeIn 0.2s ease both",
              outline: "none",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border-soft)" }}>
              <h4 id="modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                {editTarget ? "Edit Batch" : "Add Batch"}
              </h4>
              <button
                onClick={closeForm}
                disabled={saving}
                aria-label="Close modal"
                style={{ background: "none", border: "none", cursor: saving ? "not-allowed" : "pointer", color: "var(--text-muted)", fontSize: "28px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-form-grid-2">
                <AdminFormField label="Flavour" required>
                  <select className="input" value={form.flavour} onChange={(e) => handleField("flavour", e.target.value)}>
                    {BATCH_FLAVOURS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Size" required>
                  <select className="input" value={form.size} onChange={(e) => handleField("size", e.target.value)}>
                    {BATCH_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </AdminFormField>
              </div>

              <div className="admin-form-grid-2">
                <AdminFormField label="Category" required>
                  <select className="input" value={form.category} onChange={(e) => handleField("category", e.target.value)}>
                    {BATCH_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Qty Produced" required hint="Available stock is auto-calculated">
                  <input className="input" type="number" min="1" required
                    value={form.qtyProduced}
                    placeholder="e.g. 24"
                    onChange={(e) => handleField("qtyProduced", e.target.value)}
                  />
                </AdminFormField>
              </div>

              <div className="admin-form-grid-2">
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

              <AdminFormField label="Notes">
                <textarea className="input" rows={3}
                  value={form.notes}
                  placeholder="Optional batch notes…"
                  onChange={(e) => handleField("notes", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid var(--border-soft)", marginTop: "8px" }}>
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

      {/* ── Inventory Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .inventory-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .inventory-kpi-card {
          min-height: 125px;
        }

        @media (max-width: 1199px) {
          .inventory-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        
        @media (max-width: 639px) {
          .inventory-kpi-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        .inventory-table-row:hover td {
          background: rgba(0,0,0,0.02);
        }
        
        .inventory-accordion-btn:hover {
          background: var(--bg-soft) !important;
        }

        .inventory-batch-toolbar input,
        .inventory-batch-toolbar select {
          min-width: 0;
          height: 48px;
          padding: 0 1rem;
          font-size: 1rem;
          line-height: 1.2;
        }

        .admin-form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 639px) {
          .admin-form-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </AdminLayout>
  );
}