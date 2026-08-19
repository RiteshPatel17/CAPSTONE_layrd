"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/admin/StatusBadge";
import { getOrders, getOrderWithItems, updateOrderStatus } from "@/lib/admin-orders";
import { ORDER_STATUSES } from "@/lib/constants";

function exportToCSV(orders, setCsvExporting, showToast, showError) {
  if (orders.length === 0) {
    showError("No orders to export.");
    return;
  }
  setCsvExporting(true);
  try {
    const headers = ["Order ID","Customer","Email","Fulfillment","Payment Method","Payment Status","Items","Subtotal","GST","Delivery","Total","Status","Date"];
    const rows = orders.map((o) => [
      o.order_number || o.id.slice(0,8), 
      o.customer_name || "", 
      o.customer_email || "", 
      o.delivery_method || "", 
      o.payment_method || "", 
      o.payment_status || "",
      o.items || 0, 
      o.subtotal || 0, 
      o.gst || 0, 
      o.delivery_fee || 0, 
      o.total || 0,
      o.status || "", 
      new Date(o.created_at).toLocaleString()
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layrd-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully.");
  } catch (err) {
    showError("Failed to export CSV.");
  } finally {
    setCsvExporting(false);
  }
}

// Server Actions can't read the browser's session automatically, so we
// fetch the current access token here and pass it explicitly into every
// admin-orders.js call.
async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function InfoRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px", alignItems: "flex-start", gap: "16px" }}>
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: bold ? 600 : 400, color: "var(--text-main)", textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  
  const [selected, setSelected] = useState(null); // full order with lineItems
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);

  const [toast, setToast] = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);

  const modalRef = useRef(null);
  const lastActiveElement = useRef(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await getAccessToken();
      const data = await getOrders(token);
      setOrders(data);
    } catch (err) {
      setLoadError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
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

  // Dynamic filter options based on real data
  const fulfillmentOptions = useMemo(() => {
    const opts = new Set(orders.map(o => o.delivery_method).filter(Boolean));
    return ["All", ...Array.from(opts)];
  }, [orders]);

  const paymentOptions = useMemo(() => {
    const opts = new Set(orders.map(o => o.payment_status).filter(Boolean));
    return ["All", ...Array.from(opts)];
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Status
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      // Fulfillment
      if (fulfillmentFilter !== "All" && o.delivery_method !== fulfillmentFilter) return false;
      // Payment
      if (paymentFilter !== "All" && o.payment_status !== paymentFilter) return false;
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const numMatches = o.order_number?.toLowerCase().includes(q);
        const nameMatches = o.customer_name?.toLowerCase().includes(q);
        const emailMatches = o.customer_email?.toLowerCase().includes(q);
        if (!numMatches && !nameMatches && !emailMatches) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, fulfillmentFilter, paymentFilter]);

  // Safely close details if selected order disappears from filtered list
  useEffect(() => {
    if (selected && !filtered.some(o => o.id === selected.id)) {
      closeDetails();
    }
  }, [filtered, selected]);

  async function handleSelectOrder(orderId) {
    lastActiveElement.current = document.activeElement;
    setIsDetailLoading(true);
    try {
      const token = await getAccessToken();
      const fullOrder = await getOrderWithItems(token, orderId);
      setSelected(fullOrder);
    } catch (err) {
      showError("Failed to load order details. " + (err.message || String(err)));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetails() {
    setSelected(null);
    if (lastActiveElement.current) {
      lastActiveElement.current.focus();
    }
  }

  async function handleStatusChange(id, status) {
    if (savingStatus) return;
    setSavingStatus(true);
    try {
      const token = await getAccessToken();
      const updated = await updateOrderStatus(token, id, status);
      if (updated) {
        showToast("Order status updated successfully.");
        await loadOrders();
        if (selected?.id === id) {
          // Re-fetch details quietly
          const fullOrder = await getOrderWithItems(token, id);
          setSelected(fullOrder);
        }
      } else {
        showError("Failed to update status.");
      }
    } catch (err) {
      showError(err.message || "An error occurred during update.");
    } finally {
      setSavingStatus(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setFulfillmentFilter("All");
    setPaymentFilter("All");
  }

  // Modal accessibility & lock body scroll
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      if (modalRef.current) modalRef.current.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  function handleModalKeyDown(e) {
    if (e.key === "Escape" && !savingStatus) {
      closeDetails();
    }
  }

  const hasActiveFilters = search || statusFilter !== "All" || fulfillmentFilter !== "All" || paymentFilter !== "All";
  const newCount = orders.filter(o => o.status === "New").length;

  const Icons = {
    Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  };

  // Shared Order Detail Content Component
  const OrderDetailContent = () => (
    <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Group: Customer & General */}
      <div>
        <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 600 }}>Customer</h3>
        <div style={{ background: "var(--bg-soft)", padding: "16px", borderRadius: "8px" }}>
          <InfoRow label="Email" value={selected.customer_email || "—"} />
          <InfoRow label="Phone" value={selected.customer_phone || "—"} />
        </div>
      </div>

      {/* Group: Fulfillment & Payment */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        <div>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 600 }}>Fulfillment</h3>
          <div style={{ background: "var(--bg-soft)", padding: "16px", borderRadius: "8px", height: "100%" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, textTransform: "capitalize", color: "var(--text-main)" }}>{selected.delivery_method || "—"}</p>
            {selected.delivery_address && <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.4 }}>{selected.delivery_address}</p>}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 600 }}>Payment</h3>
          <div style={{ background: "var(--bg-soft)", padding: "16px", borderRadius: "8px", height: "100%" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, textTransform: "capitalize", color: "var(--text-main)" }}>{selected.payment_method || "—"}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Status: <strong>{selected.payment_status || "—"}</strong></p>
          </div>
        </div>
      </div>

      {/* Group: Notes */}
      {selected.notes && (
        <div>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 600 }}>Order Notes</h3>
          <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "16px", borderRadius: "8px", color: "var(--text-main)", fontSize: "14px", lineHeight: 1.5 }}>
            {selected.notes}
          </div>
        </div>
      )}

      {/* Group: Items Ordered */}
      <div>
        <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 600 }}>Items Ordered</h3>
        <div style={{ background: "var(--bg-soft)", borderRadius: "8px", overflow: "hidden" }}>
          {(!selected.lineItems || selected.lineItems.length === 0) ? (
            <p style={{ padding: "16px", margin: 0, color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>No items found.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {selected.lineItems.map((item, idx) => (
                <li key={item.id || idx} style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderBottom: idx < selected.lineItems.length - 1 ? "1px solid var(--border-soft)" : "none", fontSize: "14px" }}>
                  <div style={{ paddingRight: "16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>
                      {item.product_name || <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontWeight: 400 }}>Product details unavailable</span>}
                    </div>
                    {(item.size_ml || item.sweetness) && (
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        {item.size_ml && `${item.size_ml}ml`}
                        {item.size_ml && item.sweetness && " · "}
                        {item.sweetness && item.sweetness}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)", flexShrink: 0 }}>
                    ×{item.quantity}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Group: Totals */}
      <div>
        <div style={{ background: "var(--bg-soft)", padding: "16px", borderRadius: "8px" }}>
          <InfoRow label="Subtotal" value={`$${Number(selected.subtotal || 0).toFixed(2)}`} />
          {Number(selected.discount) > 0 && <InfoRow label={`Discount (${selected.promo_code || 'Promo'})`} value={`-$${Number(selected.discount).toFixed(2)}`} />}
          <InfoRow label="Delivery" value={`$${Number(selected.delivery_fee || 0).toFixed(2)}`} />
          <InfoRow label="GST" value={`$${Number(selected.gst || 0).toFixed(2)}`} />
          <div style={{ height: "1px", background: "var(--border-soft)", margin: "12px 0" }} />
          <InfoRow label="Total" value={`$${Number(selected.total || 0).toFixed(2)}`} bold />
        </div>
      </div>

      {/* Group: Status Action */}
      <div style={{ marginTop: "8px" }}>
        <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 600 }}>Update Status</h3>
        <select
          className="input"
          value={selected.status}
          onChange={(e) => handleStatusChange(selected.id, e.target.value)}
          disabled={savingStatus}
          style={{ width: "100%", margin: 0 }}
        >
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {savingStatus && <p style={{ fontSize: "13px", color: "var(--accent)", margin: "8px 0 0" }}>Saving...</p>}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {/* ── Internal Page Header ── */}
      <div className="orders-page-header" style={{
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
        gap: "16px", marginBottom: "32px", paddingTop: "8px"
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "var(--text-main)" }}>Orders</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "16px" }}>
            {loading ? "Loading orders..." : loadError ? "Failed to load data" : `${orders.length} total orders · ${newCount} new`}
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => exportToCSV(filtered, setCsvExporting, showToast, showError)}
          disabled={loading || csvExporting || orders.length === 0}
          style={{ padding: "8px 16px", fontSize: "14px", border: "1px solid var(--border-soft)" }}
        >
          {csvExporting ? "Exporting..." : "↓ Export CSV"}
        </button>
      </div>

      {/* ── Notifications ── */}
      {toast && (
        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", padding: "12px 16px", borderRadius: "6px", fontSize: "14px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }} role="status">
          <Icons.Check /> {toast}
        </div>
      )}
      {errorAlert && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "12px 16px", borderRadius: "6px", fontSize: "14px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
          <Icons.Alert /> {errorAlert}
        </div>
      )}

      {/* ── Filter Toolbar ── */}
      <div className="orders-filter-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
        <input 
          type="text" placeholder="Search order #, customer, email..." 
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="input" style={{ flex: "1 1 240px", margin: 0 }}
        />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: "1 1 140px", margin: 0 }}>
          <option value="All">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={fulfillmentFilter} onChange={(e) => setFulfillmentFilter(e.target.value)} style={{ flex: "1 1 140px", margin: 0 }}>
          {fulfillmentOptions.map(o => <option key={o} value={o}>{o === "All" ? "All Fulfillment" : (o.charAt(0).toUpperCase() + o.slice(1))}</option>)}
        </select>
        <select className="input" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ flex: "1 1 140px", margin: 0 }}>
          {paymentOptions.map(o => <option key={o} value={o}>{o === "All" ? "All Payments" : (o.charAt(0).toUpperCase() + o.slice(1))}</option>)}
        </select>
        {hasActiveFilters && (
          <button className="btn btn-ghost" onClick={clearFilters} style={{ height: "48px" }}>Clear Filters</button>
        )}
      </div>

      <div style={{ marginBottom: "16px", fontSize: "14px", color: "var(--text-muted)" }}>
        Showing {filtered.length} of {orders.length} orders
      </div>

      {/* ── Main Layout (Table/Cards + Side Panel) ── */}
      <div className="orders-layout-grid" style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        
        {/* Orders List Container */}
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
              Loading orders...
            </div>
          ) : loadError ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#ef4444", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
              {loadError}
            </div>
          ) : (
            <>
              {/* Desktop Table (Visible >= 1024px) */}
              <div className="orders-desktop-table" style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <div className="table-responsive" style={{ margin: 0, border: "none" }}>
                  <table className="table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                    <thead style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                      <tr>
                        <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order</th>
                        <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                        <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fulfillment</th>
                        <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment</th>
                        <th style={{ padding: "16px 20px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
                        <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                        <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 20px" }}>
                            {orders.length === 0 ? "No orders found." : "No orders match your filters."}
                          </td>
                        </tr>
                      ) : (
                        filtered.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => handleSelectOrder(order.id)}
                            className="orders-table-row"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectOrder(order.id); } }}
                            style={{
                              cursor: "pointer",
                              background: selected?.id === order.id ? "var(--bg-soft)" : "transparent",
                              borderBottom: "1px solid var(--border-soft)",
                              transition: "background 0.15s",
                            }}
                          >
                            <td style={{ padding: "16px 20px", fontWeight: 700, fontSize: "16px", color: "var(--text-main)", whiteSpace: "nowrap" }}>
                              {order.order_number || <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{order.id.slice(0, 8)} (Legacy)</span>}
                            </td>
                            <td style={{ padding: "16px 20px", color: "var(--text-main)", fontSize: "16px", fontWeight: 500 }}>{order.customer_name || "—"}</td>
                            <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "16px", textTransform: "capitalize" }}>{order.delivery_method || "—"}</td>
                            <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "16px", textTransform: "capitalize" }}>{order.payment_status || "—"}</td>
                            <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, fontSize: "16px", color: "var(--text-main)" }}>${Number(order.total || 0).toFixed(2)}</td>
                            <td style={{ padding: "16px 20px", fontSize: "14px" }}><StatusBadge status={order.status} /></td>
                            <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "15px" }}>{new Date(order.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards (Visible < 1024px) */}
              <div className="orders-mobile-cards" style={{ display: "none", flexDirection: "column", gap: "16px" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                    {orders.length === 0 ? "No orders found." : "No orders match your filters."}
                  </div>
                ) : (
                  filtered.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => handleSelectOrder(order.id)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectOrder(order.id); } }}
                      style={{ 
                        background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", 
                        padding: "16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)", marginBottom: "4px" }}>
                            {order.order_number || <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{order.id.slice(0, 8)} (Legacy)</span>}
                          </div>
                          <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-main)" }}>{order.customer_name || "—"}</div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "15px", color: "var(--text-muted)" }}>
                        <div><strong style={{ fontWeight: 600 }}>Total:</strong> ${Number(order.total || 0).toFixed(2)}</div>
                        <div><strong style={{ fontWeight: 600 }}>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</div>
                        <div style={{ textTransform: "capitalize" }}><strong style={{ fontWeight: 600 }}>Fulfillment:</strong> {order.delivery_method || "—"}</div>
                        <div style={{ textTransform: "capitalize" }}><strong style={{ fontWeight: 600 }}>Payment:</strong> {order.payment_status || "—"}</div>
                      </div>

                      <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px", textAlign: "center", color: "var(--accent)", fontWeight: 600, fontSize: "14px" }}>
                        View Order
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Order Detail Modal (All Screen Sizes) ── */}
      {selected && (
        <div className="orders-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div 
            ref={modalRef} tabIndex={-1} onKeyDown={handleModalKeyDown} role="dialog" aria-modal="true" aria-labelledby="order-modal-title"
            style={{ background: "var(--bg-main)", width: "100%", maxWidth: "600px", height: "100%", maxHeight: "90vh", borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", outline: "none" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-card)", borderRadius: "12px 12px 0 0" }}>
              <div>
                <button onClick={closeDetails} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "13px", height: "auto", marginBottom: "8px", marginLeft: "-8px" }}>
                  ← Back to Orders
                </button>
                <div id="order-modal-title" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)", lineHeight: 1 }}>
                  {selected.order_number || `${selected.id.slice(0, 8)} (Legacy)`}
                </div>
              </div>
              <button onClick={closeDetails} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "28px", padding: "4px", alignSelf: "flex-start" }}>
                ×
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: "1 1 auto", paddingTop: "24px", background: "var(--bg-main)" }}>
              {isDetailLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading details...</div>
              ) : (
                <OrderDetailContent />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .orders-filter-toolbar input,
        .orders-filter-toolbar select {
          min-width: 0;
          height: 48px;
          padding: 0 1rem;
          font-size: 16px;
          line-height: 1.2;
        }

        .orders-table-row:hover td {
          background: rgba(0,0,0,0.02);
        }

        /* 1280px Scale text slightly */
        @media (max-width: 1279px) {
          .orders-desktop-table th {
            font-size: 14px !important;
            padding: 14px 16px !important;
          }
          .orders-table-row td {
            font-size: 15px !important;
            padding: 14px 16px !important;
          }
          .orders-table-row td:nth-child(6) {
             font-size: 13px !important; /* badges */
          }
        }

        /* 1024px Mobile table behavior */
        @media (max-width: 1023px) {
          .orders-desktop-table {
            display: none !important;
          }
          .orders-mobile-cards {
            display: flex !important;
          }
        }
      `}} />
    </AdminLayout>
  );
}